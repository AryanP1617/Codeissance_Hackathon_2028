import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { SourceCustomer } from "../models/sourceCustomer.models.js";
import {
  cleanPhone,
  cleanEmail,
  cleanName,
  cleanPan,
  processIdentityResolution
} from "../services/resolution.service.js";
import { evaluateAllGoldenCustomers } from "../services/nbo.service.js";

/**
 * Extracts clean email address from raw email strings or markdown mailto format
 */
const extractPlainEmail = (emailStr) => {
  if (!emailStr) return "";
  const match = String(emailStr).match(/\[(.*?)\]|\((?:mailto:)?(.*?)\)/);
  if (match) {
    const raw = match[1] || match[2];
    if (raw) return raw.replace("mailto:", "").trim().toLowerCase();
  }
  return cleanEmail(emailStr);
};

/**
 * Data Ingestion Controller (3-step workflow)
 * Step 1: Ingest raw customer data payload and save to SourceCustomer DB collection
 * Step 2: Run Identity Resolution Engine to stitch matching profiles together
 * Step 3: Run Next-Best-Opportunity (NBO) Engine to generate cross-sell leads
 */
const ingestData = asyncHandler(async (req, res) => {
  let records = req.body;

  if (records && typeof records === "object" && !Array.isArray(records)) {
    if (Array.isArray(records.records)) {
      records = records.records;
    } else if (Array.isArray(records.data)) {
      records = records.data;
    } else if (records.sourceSystem && records.sourceCustomerId) {
      records = [records];
    }
  }

  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "Payload is required and must contain customer records");
  }

  // Step 1: Ingest & Save raw records into SourceCustomer database
  const savedRecords = [];
  for (const item of records) {
    if (!item.sourceSystem || !item.sourceCustomerId) {
      throw new ApiError(
        400,
        "Each record must contain 'sourceSystem' and 'sourceCustomerId'"
      );
    }

    const rawAttrs = item.rawAttributes || {};
    const plainEmail = extractPlainEmail(rawAttrs.email || item.email);
    const cleanedPhone = cleanPhone(rawAttrs.mobile || rawAttrs.phone || item.mobile || item.phone);
    const cleanedPan = cleanPan(rawAttrs.pan || item.pan);
    const cleanedName = cleanName(rawAttrs.cleanFullName || rawAttrs.fullName || item.fullName);

    const holdings = item.holdingsData || {};
    const dHoldings = item.domainHoldings || {};

    const sourceDoc = await SourceCustomer.findOneAndUpdate(
      {
        sourceSystem: item.sourceSystem,
        sourceCustomerId: item.sourceCustomerId
      },
      {
        sourceSystem: item.sourceSystem,
        sourceCustomerId: item.sourceCustomerId,
        rawAttributes: {
          fullName: rawAttrs.fullName || item.fullName || "",
          cleanFullName: cleanedName,
          email: plainEmail,
          cleanEmail: plainEmail,
          phone: rawAttrs.mobile || rawAttrs.phone || item.mobile || item.phone || "",
          cleanPhone: cleanedPhone,
          pan: cleanedPan || rawAttrs.pan || item.pan || "",
          city: rawAttrs.city || item.city || "",
          dateOfBirth: rawAttrs.dateOfBirth || item.dateOfBirth || null,
          dob: (rawAttrs.dateOfBirth || item.dateOfBirth) ? new Date(rawAttrs.dateOfBirth || item.dateOfBirth) : null,
          rawPayload: item
        },
        holdingsData: holdings,
        domainHoldings: dHoldings,
        linkageStatus: {
          status: "UNLINKED",
          goldenCustomerId: null
        },
        ingestedAt: new Date()
      },
      { upsert: true, new: true }
    );
    savedRecords.push(sourceDoc);
  }

  // Step 2: Identity Resolution Engine - Stitch matching profiles together
  const resolutionSummary = await processIdentityResolution();

  // Step 3: Next-Best-Opportunity (NBO) Engine - Generate cross-sell leads
  const nboSummary = await evaluateAllGoldenCustomers();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ingestedCount: savedRecords.length,
        savedRecords,
        identityResolution: resolutionSummary,
        nboEvaluation: nboSummary
      },
      "Data ingestion, identity resolution, and NBO generation workflow completed successfully"
    )
  );
});

export { ingestData, ingestData as ingestCustomerData, ingestData as handleIngest };
export default ingestData;
