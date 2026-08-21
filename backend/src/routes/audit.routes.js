import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const audit_router = Router();

// Secured Audit Trail Endpoints (requires JWT authentication)
audit_router.use(verifyJwt);

audit_router.route("/get-audit-logs").get(getAuditLogs);
audit_router.route("/").get(getAuditLogs);

export { audit_router };
export default audit_router;
