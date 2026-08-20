import { Router } from "express";
import {
    getOpportunities,
    getOpportunityById,
    updateOpportunityStatus,
    getOpportunityAnalytics,
    recalculateCustomerOpportunities,
    getAICrossSellInsight
} from "../controllers/opportunity.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";


const opportunity_router = Router();

opportunity_router.use(verifyJwt);

opportunity_router.route("/get-opportunities").get(getOpportunities);
opportunity_router.route("/analytics").get(getOpportunityAnalytics);
opportunity_router.route("/recalculate").post(recalculateCustomerOpportunities);
opportunity_router.route("/recalculate/:goldenCustomerId").post(recalculateCustomerOpportunities);
opportunity_router.route("/:id").get(getOpportunityById);
opportunity_router.route("/:id/status").patch(updateOpportunityStatus);
opportunity_router.route("/ai-insight/:goldenCustomerId").get(getAICrossSellInsight);
export default opportunity_router;