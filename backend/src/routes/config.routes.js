import { Router } from "express";
import {
    getAllConfigRules,
    getConfigRuleById,
    createConfigRule,
    updateConfigRule,
    toggleRuleStatus
} from "../controllers/config.controller.js";
import { verifyJwt, authorizeRoles } from "../middlewares/auth.middleware.js";

const config_router = Router();

config_router.use(verifyJwt);
config_router.use(authorizeRoles("ADMIN", "JUDGE"));

config_router.route("/get-all-config-rules").get(getAllConfigRules)
config_router.route('/create-config-rule').post(createConfigRule);
config_router.route("/:ruleId").get(getConfigRuleById).patch(updateConfigRule);
config_router.route("/:ruleId/toggle").patch(toggleRuleStatus);

export default config_router;