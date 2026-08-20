import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { NBOOpportunity } from "../models/nboOpportunity.models.js";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { ConfigRule } from "../models/configRule.models.js";
import {
  evaluateCustomerOpportunities,
  evaluateAllGoldenCustomers
} from "../services/nbo.service.js";
import { logAuditEvent } from "../services/audit.service.js";
import { generateCrossSellLead } from "../services/aiInsight.service.js";


/**
 * 1. getOpportunities / getOpportuniteies (Dynamic RM Feed & Filtering)
 * Query Builder: Extracts status, opportunityType, minPriorityScore to dynamically construct query filters.
 * Horizontal Access Control: If RM, restricts to assignedGoldenCustomerIds.
 * Concurrent Execution: Uses Promise.all for countDocuments and .find().skip().limit().populate().
 */
const getOpportunities = asyncHandler(async (req, res) => {
  const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const { opportunityType, status, minPriorityScore, minScore, goldenCustomerId, sortBy } = req.query;

  const query = {};

  // Horizontal Access Control for RM
  if (req.user?.role === "RM") {
    const assignedIds = req.user.assignedGoldenCustomerIds || [];
    const assignedCustomers = await GoldenCustomer.find({
      goldenCustomerId: { $in: assignedIds }
    }).select("_id");
    query.goldenCustomer = { $in: assignedCustomers.map((c) => c._id) };
  }

  if (goldenCustomerId) {
    const isObjectId = mongoose.Types.ObjectId.isValid(goldenCustomerId);
    const goldenDoc = await GoldenCustomer.findOne({
      $or: [{ goldenCustomerId }, ...(isObjectId ? [{ _id: goldenCustomerId }] : [])]
    });
    if (goldenDoc) {
      query.goldenCustomer = goldenDoc._id;
    }
  }

  if (opportunityType) {
    query.opportunityType = opportunityType;
  }

  if (status) {
    query.status = status.toUpperCase();
  }

  const scoreThreshold = minPriorityScore || minScore;
  if (scoreThreshold) {
    query.priorityScore = { $gte: Number(scoreThreshold) };
  }

  // Parse sorting flags
  let sortOptions = { priorityScore: -1, createdAt: -1 };
  if (sortBy) {
    const parts = sortBy.split(":");
    const field = parts[0];
    const order = parts[1] === "asc" || parts[1] === "1" ? 1 : -1;
    sortOptions = { [field]: order };
  }

  const skip = (pageNumber - 1) * limitNumber;

  // Concurrent Execution via Promise.all
  const [totalCount, opportunities] = await Promise.all([
    NBOOpportunity.countDocuments(query),
    NBOOpportunity.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate({
        path: "goldenCustomer",
        select: "goldenCustomerId personalProfile totalRelationshipValue status"
      })
      .lean()
  ]);

  const totalPages = Math.ceil(totalCount / limitNumber) || 1;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        opportunities,
        pagination: {
          totalCount,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1
        }
      },
      "NBO opportunities retrieved successfully"
    )
  );
});

// Alias export for typo support


/**
 * 2. getOpportunityById / getooprtunityById (Deep Explainability View)
 * Dual Identifier Lookup: Supports lookup by custom alphanumeric ID (opportunityId) or MongoDB _id.
 * Populated Context: Hydrates customer details and links back to originating ConfigRule document.
 * Security Validation: Rejects requests from RMs if target customer is not in assigned portfolio.
 */
const getOpportunityById = asyncHandler(async (req, res) => {
  const { id, opportunityId } = req.params;
  const targetId = opportunityId || id;

  if (!targetId) {
    throw new ApiError(400, "Opportunity ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const opportunity = await NBOOpportunity.findOne({
    $or: [{ opportunityId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
  })
    .populate({
      path: "goldenCustomer",
      select: "goldenCustomerId personalProfile totalRelationshipValue status"
    })
    .populate({
      path: "explainabilityLog.ruleId",
      model: "ConfigRule"
    });

  if (!opportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  // Security Validation for RM
  if (req.user?.role === "RM") {
    const assignedIds = req.user.assignedGoldenCustomerIds || [];
    const customerId = opportunity.goldenCustomer?.goldenCustomerId;
    if (!assignedIds.includes(customerId)) {
      throw new ApiError(
        403,
        "Access denied. You do not have permission to view opportunities for this customer."
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, opportunity, "Opportunity details fetched successfully"));
});



/**
 * 3. updateOpportunityStatus (Closed-Loop RM Actions)
 * Lifecycle State Enforcement: Validates states (GENERATED, ASSIGNED, CONTACTED, CONVERTED, DISMISSED).
 * RM Attribution: Binds user ID, name, and timestamp into assignedToRM.
 * Audit Trail Integration: Invokes audit service logAuditEvent.
 */
const updateOpportunityStatus = asyncHandler(async (req, res) => {
  const { id, opportunityId } = req.params;
  const targetId = opportunityId || id;
  const { status, notes } = req.body;

  if (!targetId) {
    throw new ApiError(400, "Opportunity ID parameter is required");
  }

  const allowedStates = ["GENERATED", "ASSIGNED", "CONTACTED", "CONVERTED", "DISMISSED"];
  const formattedStatus = status ? status.toUpperCase() : "";

  if (!allowedStates.includes(formattedStatus)) {
    throw new ApiError(
      400,
      `Invalid opportunity status. Allowed states: ${allowedStates.join(", ")}`
    );
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const opportunity = await NBOOpportunity.findOne({
    $or: [{ opportunityId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
  }).populate("goldenCustomer", "goldenCustomerId");

  if (!opportunity) {
    throw new ApiError(404, "Opportunity not found");
  }

  // Security Validation for RM
  if (req.user?.role === "RM") {
    const assignedIds = req.user.assignedGoldenCustomerIds || [];
    const customerId = opportunity.goldenCustomer?.goldenCustomerId;
    if (customerId && !assignedIds.includes(customerId)) {
      throw new ApiError(
        403,
        "Access denied. You do not have permission to update this opportunity."
      );
    }
  }

  const priorStatus = opportunity.status;
  opportunity.status = formattedStatus;

  // RM Attribution binding
  opportunity.assignedToRM = {
    rmId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
    rmName: req.user?.fullName || req.user?.username || "Assigned RM",
    assignedAt: new Date()
  };

  await opportunity.save();

  // Audit Trail Integration via audit service
  await logAuditEvent({
    action: "NBO_OVERRIDE",
    performedBy: req.user,
    targetEntity: {
      entityType: "NBO_OPPORTUNITY",
      entityId: opportunity.opportunityId
    },
    changes: {
      before: { status: priorStatus },
      after: {
        status: formattedStatus,
        assignedToRM: opportunity.assignedToRM
      }
    },
    reason: notes || `Opportunity status updated from ${priorStatus} to ${formattedStatus}`,
    req
  });

  return res
    .status(200)
    .json(new ApiResponse(200, opportunity, "Opportunity status updated successfully"));
});

/**
 * 4. getOpportunityAnalytics / GetOpportunityAnalytics (Conversion Funnel & Dashboard Metrics)
 * Aggregation Pipelines:
 * - Funnel Aggregation: Groups by status -> total volume, total potential value, avg priority score.
 * - Product Distribution: Groups by opportunityType -> volume distribution across Insurance, SIP, Wealth, Loans.
 * - Conversion Rate Metric: (Converted / Total) * 100.
 */
const getOpportunityAnalytics = asyncHandler(async (req, res) => {
  const [funnelAggregation, productDistribution] = await Promise.all([
    NBOOpportunity.aggregate([
      {
        $group: {
          _id: "$status",
          volume: { $sum: 1 },
          potentialValue: { $sum: "$potentialValue" },
          avgPriorityScore: { $avg: "$priorityScore" }
        }
      }
    ]),

    NBOOpportunity.aggregate([
      {
        $group: {
          _id: "$opportunityType",
          volume: { $sum: 1 },
          potentialValue: { $sum: "$potentialValue" },
          avgPriorityScore: { $avg: "$priorityScore" }
        }
      }
    ])
  ]);

  let totalLeads = 0;
  let convertedLeads = 0;
  let totalPipelineValue = 0;

  const funnelMetrics = {
    GENERATED: { volume: 0, potentialValue: 0, avgPriorityScore: 0 },
    ASSIGNED: { volume: 0, potentialValue: 0, avgPriorityScore: 0 },
    CONTACTED: { volume: 0, potentialValue: 0, avgPriorityScore: 0 },
    CONVERTED: { volume: 0, potentialValue: 0, avgPriorityScore: 0 },
    DISMISSED: { volume: 0, potentialValue: 0, avgPriorityScore: 0 }
  };

  funnelAggregation.forEach((item) => {
    totalLeads += item.volume;
    totalPipelineValue += item.potentialValue;

    if (item._id === "CONVERTED") {
      convertedLeads = item.volume;
    }

    if (funnelMetrics[item._id]) {
      funnelMetrics[item._id] = {
        volume: item.volume,
        potentialValue: item.potentialValue,
        avgPriorityScore: Math.round(item.avgPriorityScore || 0)
      };
    }
  });

  const conversionRateRatio = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const conversionRate = conversionRateRatio.toFixed(2) + "%";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalLeads,
          convertedLeads,
          totalPipelineValue,
          conversionRate
        },
        funnelAggregation: funnelMetrics,
        productDistribution
      },
      "Opportunity analytics and funnel metrics calculated successfully"
    )
  );
});



/**
 * 5. recalculateCustomerOpportunities (Live Portfolio Re-evaluation via NBO Service)
 * Delegates cross-sell business rules and gap evaluation to services/nbo.service.js
 */
const recalculateCustomerOpportunities = asyncHandler(async (req, res) => {
  const { id, goldenCustomerId: paramGoldenCustomerId } = req.params;
  const targetId = paramGoldenCustomerId || id || req.body.goldenCustomerId;

  if (targetId) {
    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const goldenCustomer = await GoldenCustomer.findOne({
      $or: [{ goldenCustomerId: targetId }, ...(isObjectId ? [{ _id: targetId }] : [])]
    });

    if (!goldenCustomer) {
      throw new ApiError(404, `Golden customer '${targetId}' not found for opportunity recalculation`);
    }

    const activeRules = await ConfigRule.find({ category: "NBO_CROSS_SELL", isActive: true }).lean();
    const generatedOpportunities = await evaluateCustomerOpportunities(goldenCustomer, activeRules);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          recalculatedCustomerCount: 1,
          generatedOpportunities
        },
        "Customer opportunities recalculated successfully via NBO service"
      )
    );
  } else {
    // Batch recalculation across all golden customers
    const result = await evaluateAllGoldenCustomers();
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Batch customer opportunities recalculation completed"));
  }
});



/**
 * Generates an AI-powered next-best-opportunity insight for a given Golden Customer.
 */
export const getAICrossSellInsight = asyncHandler(async (req, res) => {
  const { goldenCustomerId } = req.params;

  if (!goldenCustomerId) {
    throw new ApiError(400, "Golden Customer ID parameter is required");
  }

  const aiLead = await generateCrossSellLead(goldenCustomerId);

  return res
    .status(200)
    .json(new ApiResponse(200, aiLead, "AI Cross-Sell insight generated successfully"));
});

export {
  getOpportunities,

  getOpportunityById,

  updateOpportunityStatus,
  getOpportunityAnalytics,

  recalculateCustomerOpportunities
};
