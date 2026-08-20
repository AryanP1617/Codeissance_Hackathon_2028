import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ConfigRule } from "../models/configRule.models.js";
import { logRuleUpdate } from "../services/audit.service.js";
import { processIdentityResolution } from "../services/resolution.service.js";
import { evaluateAllGoldenCustomers } from "../services/nbo.service.js";

/**
 * 1. getAllConfigRules (GET /api/v1/config)
 * Operational Role: Lists all active or categorized rules (e.g., IDENTITY_MATCHING, NBO_CROSS_SELL, SOURCE_PRECEDENCE).
 * Powers settings dashboard for judges and administrators to view current weights, thresholds, and cross-sell bounds.
 */
const getAllConfigRules = asyncHandler(async (req, res) => {
  const { category, isActive, search } = req.query;

  const query = {};

  if (category) {
    query.category = category.toUpperCase();
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { ruleId: searchRegex },
      { ruleName: searchRegex },
      { description: searchRegex }
    ];
  }

  const rules = await ConfigRule.find(query).sort({ category: 1, version: -1, createdAt: -1 }).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { rules, totalCount: rules.length }, "Configurable rules retrieved successfully"));
});

/**
 * 2. getConfigRuleById (GET /api/v1/config/:ruleId)
 * Operational Role: Retrieves individual rule specifications including condition trees, multiplier formulas,
 * attribute weights, and version histories.
 */
const getConfigRuleById = asyncHandler(async (req, res) => {
  const { id, ruleId } = req.params;
  const targetId = ruleId || id;

  if (!targetId) {
    throw new ApiError(400, "Rule ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const rule = await ConfigRule.findOne({
    $or: [{ ruleId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
  });

  if (!rule) {
    throw new ApiError(404, `Config rule '${targetId}' not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, rule, "Config rule details fetched successfully"));
});

/**
 * 3. createConfigRule (POST /api/v1/config)
 * Operational Role: Allows dynamic addition of new cross-sell or matching rules at runtime without redeploying code.
 * (e.g. adding an "Equity Diversification" rule targeting accounts over 20 Lakhs in stock holdings).
 */
const createConfigRule = asyncHandler(async (req, res) => {
  const {
    ruleId,
    category,
    ruleName,
    description,
    isActive,
    matchingConfig,
    precedenceConfig,
    nboConfig
  } = req.body;

  if (!ruleId || !category || !ruleName) {
    throw new ApiError(400, "ruleId, category, and ruleName are required fields");
  }

  const validCategories = ["IDENTITY_MATCHING", "SOURCE_PRECEDENCE", "NBO_CROSS_SELL"];
  if (!validCategories.includes(category.toUpperCase())) {
    throw new ApiError(400, `Invalid category. Must be one of: ${validCategories.join(", ")}`);
  }

  const existingRule = await ConfigRule.findOne({ ruleId: ruleId.trim() });
  if (existingRule) {
    throw new ApiError(409, `Config rule with ruleId '${ruleId}' already exists`);
  }

  const rule = await ConfigRule.create({
    ruleId: ruleId.trim(),
    category: category.toUpperCase(),
    ruleName: ruleName.trim(),
    description: description || "",
    isActive: isActive !== undefined ? isActive : true,
    version: 1,
    matchingConfig: matchingConfig || {},
    precedenceConfig: precedenceConfig || [],
    nboConfig: nboConfig || {},
    lastUpdatedBy: {
      userId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
      userRole: req.user?.role || "ADMIN",
      updatedAt: new Date()
    }
  });

  // Log in Audit Trail
  await logRuleUpdate({
    user: req.user,
    ruleId: rule.ruleId,
    category: rule.category,
    before: null,
    after: rule,
    reason: `New config rule '${rule.ruleName}' created dynamically`,
    req
  });

  return res
    .status(201)
    .json(new ApiResponse(201, rule, "Config rule created successfully"));
});

/**
 * 4. updateConfigRule (PATCH / PUT /api/v1/config/:ruleId)
 * Mandatory Judge Demo Requirement: Allows judges to change parameters on the fly
 * (such as adjusting autoMergeThreshold from 0.85 to 0.75, or changing insurance gap threshold).
 * Immediately triggers automated re-evaluation (evaluateAllGoldenCustomers or processIdentityResolution)
 * and returns updated summary metrics in the response. Writes before/after diff into AuditLog via logRuleUpdate.
 */
const updateConfigRule = asyncHandler(async (req, res) => {
  const { id, ruleId } = req.params;
  const targetId = ruleId || id;
  const updates = req.body;

  if (!targetId) {
    throw new ApiError(400, "Rule ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const rule = await ConfigRule.findOne({
    $or: [{ ruleId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
  });

  if (!rule) {
    throw new ApiError(404, `Config rule '${targetId}' not found`);
  }

  const beforeState = JSON.parse(JSON.stringify(rule.toObject()));

  if (updates.ruleName) rule.ruleName = updates.ruleName;
  if (updates.description !== undefined) rule.description = updates.description;
  if (updates.isActive !== undefined) rule.isActive = updates.isActive;
  if (updates.matchingConfig) {
    rule.matchingConfig = { ...rule.matchingConfig, ...updates.matchingConfig };
  }
  if (updates.precedenceConfig) rule.precedenceConfig = updates.precedenceConfig;
  if (updates.nboConfig) {
    rule.nboConfig = { ...rule.nboConfig, ...updates.nboConfig };
  }

  rule.version = (rule.version || 1) + 1;
  rule.lastUpdatedBy = {
    userId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
    userRole: req.user?.role || "JUDGE",
    updatedAt: new Date()
  };

  await rule.save();

  // Audit Log Entry
  await logRuleUpdate({
    user: req.user,
    ruleId: rule.ruleId,
    category: rule.category,
    before: beforeState,
    after: rule,
    reason: `Runtime config rule update for '${rule.ruleName}' (Version ${rule.version})`,
    req
  });

  // Immediate Re-evaluation Trigger based on Rule Category
  let reevaluationSummary = null;

  if (rule.category === "IDENTITY_MATCHING" || rule.category === "SOURCE_PRECEDENCE") {
    reevaluationSummary = await processIdentityResolution();
  } else if (rule.category === "NBO_CROSS_SELL") {
    reevaluationSummary = await evaluateAllGoldenCustomers();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rule,
        reevaluationTriggered: true,
        reevaluationSummary
      },
      "Config rule updated and automated re-evaluation executed successfully"
    )
  );
});

/**
 * 5. toggleRuleStatus (PATCH /api/v1/config/:ruleId/toggle)
 * Operational Role: Quickly turns off rules that are temporarily out of scope or season
 * without removing historic audit or version linkages.
 */
const toggleRuleStatus = asyncHandler(async (req, res) => {
  const { id, ruleId } = req.params;
  const targetId = ruleId || id;

  if (!targetId) {
    throw new ApiError(400, "Rule ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const rule = await ConfigRule.findOne({
    $or: [{ ruleId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
  });

  if (!rule) {
    throw new ApiError(404, `Config rule '${targetId}' not found`);
  }

  const beforeState = JSON.parse(JSON.stringify(rule.toObject()));

  rule.isActive = !rule.isActive;
  rule.version = (rule.version || 1) + 1;
  rule.lastUpdatedBy = {
    userId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
    userRole: req.user?.role || "JUDGE",
    updatedAt: new Date()
  };

  await rule.save();

  // Audit Log Entry
  await logRuleUpdate({
    user: req.user,
    ruleId: rule.ruleId,
    category: rule.category,
    before: beforeState,
    after: rule,
    reason: `Config rule '${rule.ruleName}' active status toggled to ${rule.isActive}`,
    req
  });

  // Re-evaluate NBO if cross-sell rule was toggled
  let reevaluationSummary = null;
  if (rule.category === "NBO_CROSS_SELL") {
    reevaluationSummary = await evaluateAllGoldenCustomers();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rule,
        isActive: rule.isActive,
        reevaluationSummary
      },
      `Config rule '${rule.ruleName}' has been ${rule.isActive ? "enabled" : "disabled"}`
    )
  );
});

export {
  getAllConfigRules,
  getConfigRuleById,
  createConfigRule,
  updateConfigRule,
  toggleRuleStatus
};
