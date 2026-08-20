import { AuditLog } from "../models/auditLog.models.js";

/**
 * Extracts IP address from Express Request object
 */
const getIpAddress = (req) => {
  if (!req) return "127.0.0.1";
  return (
    req.headers?.["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
};

/**
 * Extracts User Agent string from Express Request object
 */
const getUserAgent = (req) => {
  if (!req) return "System/Service";
  return req.headers?.["user-agent"] || "Unknown";
};

/**
 * Generic Audit Log Creator
 */
export const createAuditLog = async ({
  action,
  performedBy,
  targetEntity = {},
  changes = {},
  reason = "",
  req = null
}) => {
  try {
    const auditId = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const userObj = {
      userId: performedBy?.userId || performedBy?._id?.toString() || "SYSTEM",
      userName: performedBy?.userName || performedBy?.fullName || performedBy?.username || "System Administrator",
      userRole: performedBy?.userRole || performedBy?.role || "SYSTEM"
    };

    const auditEntry = await AuditLog.create({
      auditId,
      action,
      performedBy: userObj,
      targetEntity: {
        entityType: targetEntity.entityType || "GOLDEN_CUSTOMER",
        entityId: targetEntity.entityId || "N/A"
      },
      changes: {
        before: changes.before || null,
        after: changes.after || null,
        delta: changes.delta || null
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      reason: reason || `Action ${action} executed by ${userObj.userName}`,
      timestamp: new Date()
    });

    return auditEntry;
  } catch (error) {
    console.error("Failed to persist audit log entry:", error.message);
    return null;
  }
};

// Alias export for logAuditEvent
export const logAuditEvent = createAuditLog;

/**
 * Specialized Log Helper: Manual Record Merge
 */
export const logManualMerge = async ({ user, reviewId, goldenCustomerId, sourceRecords, reason, req }) => {
  return await createAuditLog({
    action: "MANUAL_MERGE",
    performedBy: user,
    targetEntity: {
      entityType: "REVIEW_QUEUE",
      entityId: reviewId
    },
    changes: {
      before: { status: "PENDING" },
      after: {
        status: "APPROVED_MERGE",
        goldenCustomerId,
        sourceRecords
      }
    },
    reason: reason || "Manual merge approved by compliance reviewer",
    req
  });
};

/**
 * Specialized Log Helper: Manual Record Split
 */
export const logManualSplit = async ({ user, reviewId, sourceRecords, reason, req }) => {
  return await createAuditLog({
    action: "MANUAL_SPLIT",
    performedBy: user,
    targetEntity: {
      entityType: "REVIEW_QUEUE",
      entityId: reviewId
    },
    changes: {
      before: { status: "PENDING" },
      after: {
        status: "REJECTED_SPLIT",
        sourceRecords
      }
    },
    reason: reason || "Manual merge candidate rejected; records split",
    req
  });
};

/**
 * Specialized Log Helper: Configuration Rule Update
 */
export const logRuleUpdate = async ({ user, ruleId, category, before, after, reason, req }) => {
  return await createAuditLog({
    action: "RULE_UPDATE",
    performedBy: user,
    targetEntity: {
      entityType: "CONFIG_RULE",
      entityId: ruleId
    },
    changes: {
      before,
      after,
      category
    },
    reason: reason || `Matching threshold / rule updated for ${ruleId}`,
    req
  });
};

/**
 * Specialized Log Helper: RM Data Access & PII Unmasking
 */
export const logDataAccess = async ({ user, goldenCustomerId, action = "RM_DATA_ACCESS", reason, req }) => {
  return await createAuditLog({
    action,
    performedBy: user,
    targetEntity: {
      entityType: "GOLDEN_CUSTOMER",
      entityId: goldenCustomerId
    },
    changes: {
      accessedAt: new Date()
    },
    reason: reason || `Customer 360 profile accessed by ${user?.role || "RM"}`,
    req
  });
};

/**
 * Paginated Audit Log Fetching for Security Administrators
 */
export const getAuditLogs = async ({
  page = 1,
  limit = 10,
  action,
  userId,
  entityType,
  startDate,
  endDate
}) => {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

  const query = {};

  if (action) {
    query.action = action;
  }

  if (userId) {
    query["performedBy.userId"] = userId;
  }

  if (entityType) {
    query["targetEntity.entityType"] = entityType;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const aggregatePipeline = AuditLog.aggregate([
    { $match: query },
    { $sort: { timestamp: -1 } }
  ]);

  const paginatedResult = await AuditLog.aggregatePaginate(aggregatePipeline, {
    page: pageNumber,
    limit: limitNumber
  });

  return {
    logs: paginatedResult.docs,
    pagination: {
      totalCount: paginatedResult.totalDocs,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      totalPages: paginatedResult.totalPages,
      hasNextPage: paginatedResult.hasNextPage,
      hasPrevPage: paginatedResult.hasPrevPage
    }
  };
};

export default {
  createAuditLog,
  logAuditEvent,
  logManualMerge,
  logManualSplit,
  logRuleUpdate,
  logDataAccess,
  getAuditLogs
};
