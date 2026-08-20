import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { NBOOpportunity } from "../models/nboOpportunity.models.js";
import { SourceCustomer } from "../models/sourceCustomer.models.js";
import { logDataAccess } from "../services/audit.service.js";

// Helper functions for PII masking per PS-04 compliance
const maskPan = (pan) => {
  if (!pan || typeof pan !== "string") return pan;
  if (pan.length <= 4) return "****";
  return "XXXXX" + pan.slice(-4);
};

const maskEmail = (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return local[0] + "***@" + domain;
  return local[0] + "***" + local[local.length - 1] + "@" + domain;
};

const maskPhone = (phone) => {
  if (!phone || typeof phone !== "string") return phone;
  if (phone.length <= 4) return "****";
  return "XXXXXX" + phone.slice(-4);
};

const maskCustomerPII = (customer) => {
  if (!customer) return customer;
  const masked = JSON.parse(JSON.stringify(customer));
  if (masked.primaryIdentifiers?.pan) {
    masked.primaryIdentifiers.pan = maskPan(masked.primaryIdentifiers.pan);
  }
  if (masked.personalProfile) {
    if (masked.personalProfile.primaryEmail) {
      masked.personalProfile.primaryEmail = maskEmail(masked.personalProfile.primaryEmail);
    }
    if (masked.personalProfile.primaryPhone) {
      masked.personalProfile.primaryPhone = maskPhone(masked.personalProfile.primaryPhone);
    }
  }
  return masked;
};

/**
 * getCustomers / getcustomers
 * Operational Role: Multi-parameter search, dynamic sorting, paginated document cursor evaluation
 * via mongoose-aggregate-paginate-v2, and horizontal RBAC isolation query injection.
 */
const getCustomers = asyncHandler(async (req, res) => {
  // 1. Input Parsing Primitives
  const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const { search, status, sortBy } = req.query;

  const query = {};

  // 2. RBAC Scoping Invariant:
  // If principal is an RM, enforce horizontal data isolation restricting to assigned Golden Customer IDs.
  // Super-users (ADMIN, MANAGER, JUDGE, COMPLIANCE_OFFICER) possess unconstrained access.
  if (req.user?.role === "RM") {
    query.goldenCustomerId = {
      $in: req.user.assignedGoldenCustomerIds || []
    };
  }

  // 3. Predicate Construction
  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { goldenCustomerId: searchRegex },
      { "personalProfile.fullName": searchRegex },
      { "personalProfile.primaryPhone": searchRegex },
      { "personalProfile.primaryEmail": searchRegex },
      { "primaryIdentifiers.pan": searchRegex }
    ];
  }

  if (status) {
    query.status = status.toUpperCase();
  }

  // Parse sorting flags
  let sortOptions = { createdAt: -1 };
  if (sortBy) {
    const parts = sortBy.split(":");
    const field = parts[0];
    const order = parts[1] === "asc" || parts[1] === "1" ? 1 : -1;

    if (field === "trv" || field === "totalRelationshipValue") {
      sortOptions = { "totalRelationshipValue.totalValue": order };
    } else if (field === "fullName" || field === "name") {
      sortOptions = { "personalProfile.fullName": order };
    } else {
      sortOptions = { [field]: order };
    }
  }

  // 4. Aggregation Pipeline Construction
  const customerAggregate = GoldenCustomer.aggregate([
    { $match: query },
    { $sort: sortOptions },
    {
      $project: {
        goldenCustomerId: 1,
        primaryIdentifiers: 1,
        personalProfile: 1,
        totalRelationshipValue: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  // 5. Projection & Cursor Execution via mongoose-aggregate-paginate-v2
  const paginatedResult = await GoldenCustomer.aggregatePaginate(customerAggregate, {
    page: pageNumber,
    limit: limitNumber
  });

  const docs = req.user?.role === "RM"
    ? paginatedResult.docs.map((doc) => maskCustomerPII(doc))
    : paginatedResult.docs;

  // 6. Metadata Synthesis
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customers: docs,
        pagination: {
          totalCount: paginatedResult.totalDocs,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          totalPages: paginatedResult.totalPages,
          hasNextPage: paginatedResult.hasNextPage,
          hasPrevPage: paginatedResult.hasPrevPage
        }
      },
      "Customers retrieved successfully"
    )
  );
});

/**
 * getCustomer360ById
 * Operational Role: High-cardinality document retrieval, cross-collection reference population,
 * domain portfolio reconciliation across 5 financial silos, and NBO recommendation hydration.
 */
const getCustomer360ById = asyncHandler(async (req, res) => {
  const { id, goldenCustomerId: paramGoldenCustomerId } = req.params;
  const targetId = paramGoldenCustomerId || id;

  if (!targetId) {
    throw new ApiError(400, "Golden Customer ID parameter is required");
  }

  // 1. Horizontal Access Validation for RM role
  if (req.user?.role === "RM") {
    const assignedIds = req.user.assignedGoldenCustomerIds || [];
    if (!assignedIds.includes(targetId)) {
      throw new ApiError(
        403,
        "Access denied. You do not have permission to view this customer profile."
      );
    }
  }

  // 2. Primary Key Document Lookup & Population across Source Customer collection
  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const goldenRecord = await GoldenCustomer.findOne({
    $or: [
      { goldenCustomerId: targetId },
      ...(isObjectId ? [{ _id: targetId }] : [])
    ]
  }).populate({
    path: "linkedSourceRecords.sourceRecordRef",
    model: "SourceCustomer"
  });

  if (!goldenRecord) {
    throw new ApiError(404, "Golden customer profile not found");
  }

  // Additional RBAC safety check if lookup occurred via MongoDB _id
  if (
    req.user?.role === "RM" &&
    !req.user.assignedGoldenCustomerIds?.includes(goldenRecord.goldenCustomerId)
  ) {
    throw new ApiError(
      403,
      "Access denied. You do not have permission to view this customer profile."
    );
  }

  // 3. Downstream Entity Hydration (NBO Opportunities)
  const nboOpportunities = await NBOOpportunity.find({
    goldenCustomer: goldenRecord._id,
    status: { $in: ["GENERATED", "ASSIGNED", "CONTACTED"] }
  }).sort({ priorityScore: -1 });

  // 4. Directly read top-level domain holdings from GoldenCustomer model
  const equity = goldenRecord.equity || { accounts: [] };
  const loans = goldenRecord.loans || { accounts: [] };
  const insurance = goldenRecord.insurance || { policies: [] };
  const mutualFunds = goldenRecord.mutualFunds || { investments: [] };
  const wealth = goldenRecord.wealth || { portfolios: [] };

  // Reconciled holdings backwards compatibility
  const reconciledHoldings = {
    equity: equity.accounts || [],
    mutualFunds: mutualFunds.investments || [],
    insurance: insurance.policies || [],
    loans: loans.accounts || [],
    wealth: wealth.portfolios || []
  };

  // Mask sensitive PII by default for RM role per PS-04 compliance
  const primaryIdentifiers = req.user?.role === "RM"
    ? {
        ...goldenRecord.primaryIdentifiers.toObject(),
        pan: maskPan(goldenRecord.primaryIdentifiers?.pan)
      }
    : goldenRecord.primaryIdentifiers;

  const personalProfile = req.user?.role === "RM"
    ? {
        ...goldenRecord.personalProfile.toObject(),
        primaryEmail: maskEmail(goldenRecord.personalProfile?.primaryEmail),
        primaryPhone: maskPhone(goldenRecord.personalProfile?.primaryPhone)
      }
    : goldenRecord.personalProfile;

  // 5. Provenance, Match Status, and 360 Synthesis
  const customer360 = {
    _id: goldenRecord._id,
    goldenCustomerId: goldenRecord.goldenCustomerId,
    primaryIdentifiers,
    personalProfile,
    totalRelationshipValue: goldenRecord.totalRelationshipValue,
    status: goldenRecord.status,
    linkedSourceRecords: goldenRecord.linkedSourceRecords,
    attributeConflicts: goldenRecord.attributeConflicts || [],
    equity,
    loans,
    insurance,
    mutualFunds,
    wealth,
    provenance: goldenRecord.provenance || [],
    matchStatus: goldenRecord.matchStatus || "AUTO_MERGED",
    reconciledHoldings,
    nboOpportunities,
    createdAt: goldenRecord.createdAt,
    updatedAt: goldenRecord.updatedAt
  };

  return res
    .status(200)
    .json(new ApiResponse(200, customer360, "Customer 360 profile fetched successfully"));
});

/**
 * unmaskCustomerPII
 * Operational Role: Audited PII unmasking endpoint for compliance (PS-04).
 * Logs PII_UNMASK_REQUEST to AuditLog and returns unmasked sensitive identifiers for a Golden Customer.
 */
const unmaskCustomerPII = asyncHandler(async (req, res) => {
  const { id, goldenCustomerId: paramGoldenCustomerId } = req.params;
  const { goldenCustomerId: bodyGoldenCustomerId, reason } = req.body;
  const targetId = paramGoldenCustomerId || id || bodyGoldenCustomerId;

  if (!targetId) {
    throw new ApiError(400, "Golden Customer ID parameter is required");
  }

  // 1. Horizontal RBAC validation for RM role
  if (req.user?.role === "RM") {
    const assignedIds = req.user.assignedGoldenCustomerIds || [];
    if (!assignedIds.includes(targetId)) {
      throw new ApiError(
        403,
        "Access denied. You do not have permission to access PII for this customer profile."
      );
    }
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
  const goldenRecord = await GoldenCustomer.findOne({
    $or: [
      { goldenCustomerId: targetId },
      ...(isObjectId ? [{ _id: targetId }] : [])
    ]
  }).lean();

  if (!goldenRecord) {
    throw new ApiError(404, "Golden customer profile not found");
  }

  if (
    req.user?.role === "RM" &&
    !req.user.assignedGoldenCustomerIds?.includes(goldenRecord.goldenCustomerId)
  ) {
    throw new ApiError(
      403,
      "Access denied. You do not have permission to access PII for this customer profile."
    );
  }

  // 2. Audit Log emission per PS-04 compliance
  await logDataAccess({
    user: req.user,
    goldenCustomerId: goldenRecord.goldenCustomerId,
    action: "PII_UNMASK_REQUEST",
    reason: reason || `Audited PII unmask request for ${goldenRecord.goldenCustomerId} by ${req.user?.role || "RM"}`,
    req
  });

  // 3. Return unmasked PII payload
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        goldenCustomerId: goldenRecord.goldenCustomerId,
        primaryIdentifiers: goldenRecord.primaryIdentifiers,
        personalProfile: goldenRecord.personalProfile,
        unmaskedAt: new Date()
      },
      "Customer PII unmasked successfully and audit log generated"
    )
  );
});

export {
  getCustomers,
  getCustomer360ById,
  unmaskCustomerPII
};

