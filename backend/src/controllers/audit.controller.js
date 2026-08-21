import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getAuditLogs as fetchAuditLogsFromService } from "../services/audit.service.js";
import { AuditLog } from "../models/auditLog.models.js";

/**
 * getAuditLogs / get-audit-logs Controller
 * Operational Role: Paginated security audit trail document cursor retrieval with action, user, and entity filters.
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
  const { action, userId, entityType, startDate, endDate, search } = req.query;

  const result = await fetchAuditLogsFromService({
    page: pageNumber,
    limit: limitNumber,
    action,
    userId,
    entityType,
    startDate,
    endDate
  });

  const totalLogsCount = await AuditLog.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs: result.logs,
        pagination: result.pagination,
        totalLogsCount
      },
      "Audit logs retrieved successfully"
    )
  );
});

export { getAuditLogs as getAuditLogsController };
export default getAuditLogs;
