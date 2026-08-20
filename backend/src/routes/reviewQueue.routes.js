import { Router } from "express";
import {
    getPendingReviews,
    resolveMerge,
    resolveSplit
} from "../controllers/reviewQueue.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const review_queue_router = Router();

review_queue_router.use(verifyJwt);

review_queue_router.route("/get-pending-reviews").get(getPendingReviews);
review_queue_router.route("/:reviewId/merge").post(resolveMerge);
review_queue_router.route("/:reviewId/split").post(resolveSplit);

export default review_queue_router;