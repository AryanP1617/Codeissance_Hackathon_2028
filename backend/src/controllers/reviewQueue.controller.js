import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ReviewQueue } from "../models/reviewQueue.models.js";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { SourceCustomer } from "../models/sourceCustomer.models.js";
import { calculateTRVForCluster } from "../services/resolution.service.js";
import { logManualMerge, logManualSplit } from "../services/audit.service.js";

/**
 * Helper to retrieve source record by ObjectId reference or sourceCustomerId + sourceSystem fallback
 */
const fetchSourceRecord = async (recordMeta) => {
  if (recordMeta?.recordRef && mongoose.Types.ObjectId.isValid(recordMeta.recordRef)) {
    const found = await SourceCustomer.findById(recordMeta.recordRef);
    if (found) return found;
  }
  if (recordMeta?.sourceCustomerId && recordMeta?.sourceSystem) {
    return await SourceCustomer.findOne({
      sourceCustomerId: recordMeta.sourceCustomerId,
      sourceSystem: recordMeta.sourceSystem
    });
  }
  return null;
};

/**
 * 1. getPendingReviews
 * What it does: Retrieves unverified borderline identity matches (status: "PENDING")
 * with full matchBreakdown and ambiguityReason.
 */
const getPendingReviews = asyncHandler(async (req, res) => {
  const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

  const query = { status: "PENDING" };

  const [totalCount, pendingReviews] = await Promise.all([
    ReviewQueue.countDocuments(query),
    ReviewQueue.find(query)
      .populate("sourceRecordA.recordRef")
      .populate("sourceRecordB.recordRef")
      .populate("sourceRecordB.goldenCustomerRef")
      .sort({ confidenceScore: -1, createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean()
  ]);

  const totalPages = Math.ceil(totalCount / limitNumber) || 1;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pendingReviews,
        pagination: {
          totalCount,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1
        }
      },
      "Pending ambiguity reviews fetched successfully"
    )
  );
});

/**
 * 2. resolveMerge
 * What it does: Approves a candidate pair merge. Stitches sourceRecordA and sourceRecordB
 * under the same Golden Customer ID, recalculates TRV breakdown via resolution service,
 * updates ReviewQueue to APPROVED_MERGE, and logs the action in AuditLog via audit service.
 */
const resolveMerge = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId || req.body.reviewId;
  const { notes, targetGoldenCustomerId } = req.body;

  if (!reviewId) {
    throw new ApiError(400, "Review ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(reviewId);
  const reviewItem = await ReviewQueue.findOne({
    $or: [{ reviewId }, ...(isObjectId ? [{ _id: reviewId }] : [])]
  });

  if (!reviewItem) {
    throw new ApiError(404, "Review queue item not found");
  }

  if (reviewItem.status !== "PENDING") {
    throw new ApiError(400, `Review item has already been resolved with status: ${reviewItem.status}`);
  }

  // Retrieve source records A and B using robust fetchSourceRecord helper with fallbacks
  const recordA = await fetchSourceRecord(reviewItem.sourceRecordA);
  const recordB = await fetchSourceRecord(reviewItem.sourceRecordB);

  if (!recordA && !recordB) {
    throw new ApiError(404, "Neither source customer record referenced in the review item could be found");
  }

  // Find or create Golden Customer target
  let goldenCustomer;

  if (targetGoldenCustomerId) {
    goldenCustomer = await GoldenCustomer.findOne({
      $or: [
        { goldenCustomerId: targetGoldenCustomerId },
        ...(mongoose.Types.ObjectId.isValid(targetGoldenCustomerId) ? [{ _id: targetGoldenCustomerId }] : [])
      ]
    });
  }

  if (!goldenCustomer && reviewItem.sourceRecordB?.goldenCustomerRef) {
    goldenCustomer = await GoldenCustomer.findById(reviewItem.sourceRecordB.goldenCustomerRef);
  }

  if (!goldenCustomer && recordA?.linkageStatus?.goldenCustomerId) {
    goldenCustomer = await GoldenCustomer.findById(recordA.linkageStatus.goldenCustomerId);
  }

  if (!goldenCustomer && recordB?.linkageStatus?.goldenCustomerId) {
    goldenCustomer = await GoldenCustomer.findById(recordB.linkageStatus.goldenCustomerId);
  }

  const activeRecord = recordA || recordB;

  // If no existing Golden Customer, create a new Golden Customer profile
  if (!goldenCustomer) {
    const newGoldenId = `GCST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    goldenCustomer = await GoldenCustomer.create({
      goldenCustomerId: newGoldenId,
      primaryIdentifiers: {
        pan: recordA?.rawAttributes?.pan || recordB?.rawAttributes?.pan,
        aadhaarHash: recordA?.rawAttributes?.aadhaarHash || recordB?.rawAttributes?.aadhaarHash
      },
      personalProfile: {
        fullName: recordA?.rawAttributes?.fullName || recordB?.rawAttributes?.fullName || "Unspecified",
        primaryEmail: recordA?.rawAttributes?.email || recordB?.rawAttributes?.email,
        primaryPhone: recordA?.rawAttributes?.phone || recordB?.rawAttributes?.phone
      },
      linkedSourceRecords: [],
      status: "ACTIVE"
    });
  }

  // Stitch source records under the target Golden Customer
  const updatedLinkedRecords = goldenCustomer.linkedSourceRecords || [];

  const addIfMissing = (sourceRec) => {
    if (!sourceRec) return;
    const exists = updatedLinkedRecords.some(
      (l) => l.sourceCustomerId === sourceRec.sourceCustomerId && l.sourceSystem === sourceRec.sourceSystem
    );
    if (!exists) {
      updatedLinkedRecords.push({
        sourceSystem: sourceRec.sourceSystem,
        sourceCustomerId: sourceRec.sourceCustomerId,
        sourceRecordRef: sourceRec._id,
        linkedAt: new Date(),
        matchType: "MANUAL_MERGE",
        confidenceScore: reviewItem.confidenceScore || 1.0
      });
    }
  };

  addIfMissing(recordA);
  addIfMissing(recordB);

  // Update linkageStatus on SourceCustomer records
  const availableRecordIds = [recordA?._id, recordB?._id].filter(Boolean);
  if (availableRecordIds.length > 0) {
    await SourceCustomer.updateMany(
      { _id: { $in: availableRecordIds } },
      {
        $set: {
          linkageStatus: {
            status: "LINKED",
            goldenCustomerId: goldenCustomer._id,
            linkedAt: new Date(),
            confidenceScore: reviewItem.confidenceScore || 1.0,
            matchReason: "MANUAL_MERGE_APPROVED"
          }
        }
      }
    );
  }

  // Recalculate Total Relationship Value (TRV) using resolution service function
  const populatedSourceRecords = await SourceCustomer.find({
    _id: { $in: updatedLinkedRecords.map((l) => l.sourceRecordRef) }
  });

  const trvData = calculateTRVForCluster(populatedSourceRecords);

  // Update GoldenCustomer
  goldenCustomer.linkedSourceRecords = updatedLinkedRecords;
  goldenCustomer.totalRelationshipValue = trvData;
  await goldenCustomer.save();

  // Update ReviewQueue status to APPROVED_MERGE
  reviewItem.status = "APPROVED_MERGE";
  reviewItem.reviewedBy = {
    userId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
    userName: req.user?.fullName || req.user?.username || "Admin User",
    userRole: req.user?.role || "ADMIN",
    reviewedAt: new Date(),
    notes: notes || "Borderline match approved via manual review queue"
  };
  await reviewItem.save();

  // Immutable Audit Log via audit service
  await logManualMerge({
    user: req.user,
    reviewId: reviewItem.reviewId,
    goldenCustomerId: goldenCustomer.goldenCustomerId,
    sourceRecords: [recordA?.sourceCustomerId, recordB?.sourceCustomerId].filter(Boolean),
    reason: notes || "Manual merge candidate pair approved",
    req
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviewItem,
        goldenCustomer
      },
      "Candidate pair merged successfully into Golden Customer profile"
    )
  );
});

/**
 * 3. resolveSplit
 * What it does: Rejects a proposed merge. Decouples the records, maintains separate Golden Records,
 * sets ReviewQueue to REJECTED_SPLIT, logs to AuditLog via audit service.
 */
const resolveSplit = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId || req.body.reviewId;
  const { notes } = req.body;

  if (!reviewId) {
    throw new ApiError(400, "Review ID parameter is required");
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(reviewId);
  const reviewItem = await ReviewQueue.findOne({
    $or: [{ reviewId }, ...(isObjectId ? [{ _id: reviewId }] : [])]
  });

  if (!reviewItem) {
    throw new ApiError(404, "Review queue item not found");
  }

  if (reviewItem.status !== "PENDING") {
    throw new ApiError(400, `Review item has already been resolved with status: ${reviewItem.status}`);
  }

  // Retrieve source records A and B using robust fetchSourceRecord helper with fallbacks
  const recordA = await fetchSourceRecord(reviewItem.sourceRecordA);
  const recordB = await fetchSourceRecord(reviewItem.sourceRecordB);

  if (!recordA && !recordB) {
    throw new ApiError(404, "Neither source customer record referenced in the review item could be found");
  }

  if (recordA) {
    recordA.linkageStatus = {
      status: "UNLINKED",
      goldenCustomerId: null,
      confidenceScore: 0,
      matchReason: "MANUAL_SPLIT_REJECTED"
    };
    await recordA.save();
  }

  if (recordB) {
    recordB.linkageStatus = {
      status: "UNLINKED",
      goldenCustomerId: null,
      confidenceScore: 0,
      matchReason: "MANUAL_SPLIT_REJECTED"
    };
    await recordB.save();
  }

  // Update ReviewQueue to REJECTED_SPLIT
  reviewItem.status = "REJECTED_SPLIT";
  reviewItem.reviewedBy = {
    userId: req.user?._id?.toString() || req.user?.username || "SYSTEM",
    userName: req.user?.fullName || req.user?.username || "Admin User",
    userRole: req.user?.role || "ADMIN",
    reviewedAt: new Date(),
    notes: notes || "Proposed merge rejected; records decoupled via manual split"
  };
  await reviewItem.save();

  // Log via Audit Service
  await logManualSplit({
    user: req.user,
    reviewId: reviewItem.reviewId,
    sourceRecords: [recordA?.sourceCustomerId, recordB?.sourceCustomerId].filter(Boolean),
    reason: notes || "Proposed fuzzy merge rejected by reviewer",
    req
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviewItem
      },
      "Proposed merge rejected and records successfully decoupled"
    )
  );
});

export {
  getPendingReviews,
  resolveMerge,
  resolveSplit
};
