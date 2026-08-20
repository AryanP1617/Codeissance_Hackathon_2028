import { Router } from "express";
import { ingestData } from "../controllers/ingest.controller.js";

const ingest_router = Router();

// Ingestion endpoint triggers 3-step workflow (save, stitch profiles, generate cross-sell leads)
ingest_router.route("/").post(ingestData);
ingest_router.route("/ingest").post(ingestData);

export { ingest_router };
export default ingest_router;
