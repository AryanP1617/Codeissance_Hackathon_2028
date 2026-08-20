import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { NBOOpportunity } from "../models/nboOpportunity.models.js";
import { SourceCustomer } from "../models/sourceCustomer.models.js";

/**
 * getCustomers / getcustomers
 * Operational Role: Multi-parameter search, dynamic sorting, paginated document cursor evaluation
 * via mongoose-aggregate-paginate-v2, and horizontal RBAC isolation query injection.
 */
const getCustomers = asyncHandler(async (req, res) => {
  // 1. Input Parsing Primitives
  const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const { search, riskCategory, status, sortBy } = req.query;

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

  if (riskCategory) {
    query.riskCategory = riskCategory.toUpperCase();
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
    } else if (field === "relationshipAgeYears") {
      sortOptions = { relationshipAgeYears: order };
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
        riskCategory: 1,
        relationshipAgeYears: 1,
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

  // 6. Metadata Synthesis
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customers: paginatedResult.docs,
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

  // 4. Domain Holdings Aggregation Algorithm across 5 financial silos
  const reconciledHoldings = {
    equity: [],
    mutualFunds: [],
    insurance: [],
    loans: [],
    wealth: []
  };

  if (goldenRecord.linkedSourceRecords && Array.isArray(goldenRecord.linkedSourceRecords)) {
    for (const link of goldenRecord.linkedSourceRecords) {
      const sourceRecord = link.sourceRecordRef;
      if (sourceRecord && sourceRecord.domainHoldings) {
        const holdings = sourceRecord.domainHoldings;

        if (Array.isArray(holdings.equityHoldings) && holdings.equityHoldings.length > 0) {
          reconciledHoldings.equity.push(
            ...holdings.equityHoldings.map((h) => ({
              ...(h.toObject ? h.toObject() : h),
              sourceSystem: sourceRecord.sourceSystem,
              sourceCustomerId: sourceRecord.sourceCustomerId
            }))
          );
        }

        if (Array.isArray(holdings.mfHoldings) && holdings.mfHoldings.length > 0) {
          reconciledHoldings.mutualFunds.push(
            ...holdings.mfHoldings.map((h) => ({
              ...(h.toObject ? h.toObject() : h),
              sourceSystem: sourceRecord.sourceSystem,
              sourceCustomerId: sourceRecord.sourceCustomerId
            }))
          );
        }

        if (Array.isArray(holdings.insurancePolicies) && holdings.insurancePolicies.length > 0) {
          reconciledHoldings.insurance.push(
            ...holdings.insurancePolicies.map((h) => ({
              ...(h.toObject ? h.toObject() : h),
              sourceSystem: sourceRecord.sourceSystem,
              sourceCustomerId: sourceRecord.sourceCustomerId
            }))
          );
        }

        if (Array.isArray(holdings.loans) && holdings.loans.length > 0) {
          reconciledHoldings.loans.push(
            ...holdings.loans.map((h) => ({
              ...(h.toObject ? h.toObject() : h),
              sourceSystem: sourceRecord.sourceSystem,
              sourceCustomerId: sourceRecord.sourceCustomerId
            }))
          );
        }

        if (Array.isArray(holdings.wealthHoldings) && holdings.wealthHoldings.length > 0) {
          reconciledHoldings.wealth.push(
            ...holdings.wealthHoldings.map((h) => ({
              ...(h.toObject ? h.toObject() : h),
              sourceSystem: sourceRecord.sourceSystem,
              sourceCustomerId: sourceRecord.sourceCustomerId
            }))
          );
        }
      }
    }
  }

  // 5. Conflict State Exposure & 360 Synthesis
  const customer360 = {
    _id: goldenRecord._id,
    goldenCustomerId: goldenRecord.goldenCustomerId,
    primaryIdentifiers: goldenRecord.primaryIdentifiers,
    personalProfile: goldenRecord.personalProfile,
    totalRelationshipValue: goldenRecord.totalRelationshipValue,
    riskCategory: goldenRecord.riskCategory,
    relationshipAgeYears: goldenRecord.relationshipAgeYears,
    status: goldenRecord.status,
    linkedSourceRecords: goldenRecord.linkedSourceRecords,
    attributeConflicts: goldenRecord.attributeConflicts || [],
    reconciledHoldings,
    nboOpportunities,
    createdAt: goldenRecord.createdAt,
    updatedAt: goldenRecord.updatedAt
  };

  return res
    .status(200)
    .json(new ApiResponse(200, customer360, "Customer 360 profile fetched successfully"));
});

// Alias export for getcustomers casing
const getcustomers = getCustomers;

export {
  getCustomers,
  getcustomers,
  getCustomer360ById
};
