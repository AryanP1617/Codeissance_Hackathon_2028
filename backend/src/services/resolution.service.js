import mongoose from "mongoose";
import { SourceCustomer } from "../models/sourceCustomer.models.js";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { ReviewQueue } from "../models/reviewQueue.models.js";
import { ConfigRule } from "../models/configRule.models.js";
import { AuditLog } from "../models/auditLog.models.js";

// ==========================================
// 1. Normalization & Cleaning Utilities
// ==========================================

export const cleanPhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length > 10 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length > 10 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(-10);
};

export const cleanEmail = (email) => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
};

export const cleanName = (name) => {
  if (!name) return "";
  return String(name)
    .trim()
    .toUpperCase()
    .replace(/\b(MR|MS|MRS|DR|SHRI|SHRIMATI|SMT|KUMARI)\b\.?/gi, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const cleanPan = (pan) => {
  if (!pan) return "";
  const cleaned = String(pan).trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(cleaned) ? cleaned : "";
};

// ==========================================
// 2. Pairwise String Similarity Scoring
// ==========================================

export const levenshteinSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).trim().toLowerCase();
  const s2 = String(str2).trim().toLowerCase();
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matrix = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
};

export const jaroWinklerSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).trim().toLowerCase();
  const s2 = String(str2).trim().toLowerCase();
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(len1, len2, maxPrefix); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
};

export const tokenSetRatio = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const tokens1 = new Set(String(str1).trim().toLowerCase().split(/\s+/));
  const tokens2 = new Set(String(str2).trim().toLowerCase().split(/\s+/));

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;

  const jaccard = intersection.size / union.size;
  const jw = jaroWinklerSimilarity(
    [...tokens1].sort().join(" "),
    [...tokens2].sort().join(" ")
  );

  return 0.5 * jaccard + 0.5 * jw;
};

// ==========================================
// 3. Union-Find Disjoint Set Clustering Algorithm
// ==========================================

export class UnionFind {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  makeSet(id) {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id) {
    if (!this.parent.has(id)) {
      this.makeSet(id);
      return id;
    }
    if (this.parent.get(id) !== id) {
      this.parent.set(id, this.find(this.parent.get(id)));
    }
    return this.parent.get(id);
  }

  union(id1, id2) {
    const root1 = this.find(id1);
    const root2 = this.find(id2);

    if (root1 !== root2) {
      const rank1 = this.rank.get(root1) || 0;
      const rank2 = this.rank.get(root2) || 0;

      if (rank1 < rank2) {
        this.parent.set(root1, root2);
      } else if (rank1 > rank2) {
        this.parent.set(root2, root1);
      } else {
        this.parent.set(root2, root1);
        this.rank.set(root1, rank1 + 1);
      }
    }
  }
}

// ==========================================
// 4. TRV (Total Relationship Value) Calculation
// ==========================================

export const calculateTRVForCluster = (records = []) => {
  const breakdown = {
    equity: 0,
    mutualFunds: 0,
    insurance: 0,
    loans: 0,
    wealth: 0
  };

  if (!Array.isArray(records) || records.length === 0) {
    return {
      totalValue: 0,
      breakdown,
      lastCalculatedAt: new Date()
    };
  }

  const safeSum = (arr, extractor) => {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((acc, item) => {
      const val = extractor(item);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  };

  for (const record of records) {
    if (!record) continue;
    const hData = record.holdingsData || {};
    const dHoldings = record.domainHoldings || {};

    // 1. Equity
    const equityHoldingsSum = safeSum(
      dHoldings.equityHoldings,
      (item) => Number(item?.currentValue ?? item?.investedValue ?? 0)
    );
    const equityVal = Number(hData.portfolioValue) || equityHoldingsSum;
    breakdown.equity += Math.max(0, equityVal);

    // 2. Mutual Funds
    const mfHoldingsSum = safeSum(
      dHoldings.mfHoldings,
      (item) => Number(item?.currentValue ?? item?.investedValue ?? 0)
    );
    const mfVal = Number(hData.totalNavValue) || mfHoldingsSum;
    breakdown.mutualFunds += Math.max(0, mfVal);

    // 3. Insurance
    const insHoldingsSum = safeSum(
      dHoldings.insurancePolicies,
      (item) => Number(item?.sumAssured ?? item?.premiumAmount ?? 0)
    );
    const insVal = Number(hData.sumAssured) || insHoldingsSum;
    breakdown.insurance += Math.max(0, insVal);

    // 4. Loans
    const loanHoldingsSum = safeSum(
      dHoldings.loans,
      (item) => Number(item?.outstandingBalance ?? item?.principalAmount ?? 0)
    );
    const loanVal = Number(hData.outstandingAmount) || loanHoldingsSum;
    breakdown.loans += Math.max(0, loanVal);

    // 5. Wealth
    const wealthHoldingsSum = safeSum(
      dHoldings.wealthHoldings,
      (item) => Number(item?.currentValue ?? item?.investedAmount ?? 0)
    );
    const wealthVal = Number(hData.aum) || wealthHoldingsSum;
    breakdown.wealth += Math.max(0, wealthVal);
  }

  const totalValue =
    breakdown.equity +
    breakdown.mutualFunds +
    breakdown.insurance +
    breakdown.loans +
    breakdown.wealth;

  return {
    totalValue,
    breakdown,
    lastCalculatedAt: new Date()
  };
};

// ==========================================
// 5. End-to-End Resolution Pipeline
// ==========================================

export const processIdentityResolution = async (customSourceRecords = null) => {
  // Load active matching rules or default thresholds
  const ruleConfig = await ConfigRule.findOne({
    category: "IDENTITY_MATCHING",
    isActive: true
  }).lean();

  const weights = ruleConfig?.matchingConfig?.attributeWeights || {
    pan: 1.0,
    fullName: 0.35,
    email: 0.30,
    phone: 0.35,
    address: 0.20
  };

  const autoMergeThreshold = ruleConfig?.matchingConfig?.autoMergeThreshold || 0.85;
  const reviewQueueMinThreshold = ruleConfig?.matchingConfig?.reviewQueueMinThreshold || 0.60;

  // Retrieve source records
  const sourceRecords = customSourceRecords || (await SourceCustomer.find({}).lean());

  if (!sourceRecords || sourceRecords.length === 0) {
    return {
      message: "No source customer records available for identity resolution.",
      processedRecordsCount: 0,
      goldenCustomerCount: 0,
      reviewQueueCount: 0
    };
  }

  // Pre-normalize all source records
  const normalizedRecords = sourceRecords.map((rec) => {
    const attrs = rec.rawAttributes || {};
    return {
      ...rec,
      _id: rec._id.toString(),
      cleanPan: cleanPan(attrs.pan),
      cleanName: cleanName(attrs.cleanFullName || attrs.fullName),
      cleanEmail: cleanEmail(attrs.cleanEmail || attrs.email),
      cleanPhone: cleanPhone(attrs.cleanPhone || attrs.mobile || attrs.phone)
    };
  });

  const uf = new UnionFind();
  normalizedRecords.forEach((r) => uf.makeSet(r._id));

  const reviewQueueItems = [];
  const pairwiseMatches = [];

  // Pairwise Similarity Evaluation
  for (let i = 0; i < normalizedRecords.length; i++) {
    for (let j = i + 1; j < normalizedRecords.length; j++) {
      const recA = normalizedRecords[i];
      const recB = normalizedRecords[j];

      let matchConfidence = 0;
      let matchType = "PROBABILISTIC";
      const breakdown = [];

      // Hard / Deterministic PAN Match check
      if (recA.cleanPan && recB.cleanPan && recA.cleanPan === recB.cleanPan) {
        matchConfidence = 1.0;
        matchType = "DETERMINISTIC";
        breakdown.push({ attribute: "pan", score: 1.0, weight: weights.pan, algorithm: "ExactMatch" });
      } else {
        // Probabilistic Matching
        let weightSum = 0;
        let weightedScore = 0;

        if (recA.cleanName && recB.cleanName) {
          const nameScore = tokenSetRatio(recA.cleanName, recB.cleanName);
          breakdown.push({ attribute: "fullName", score: nameScore, weight: weights.fullName, algorithm: "TokenSetRatio" });
          weightedScore += nameScore * weights.fullName;
          weightSum += weights.fullName;
        }

        if (recA.cleanPhone && recB.cleanPhone) {
          const phoneScore = recA.cleanPhone === recB.cleanPhone ? 1.0 : levenshteinSimilarity(recA.cleanPhone, recB.cleanPhone);
          breakdown.push({ attribute: "phone", score: phoneScore, weight: weights.phone, algorithm: "Exact/Levenshtein" });
          weightedScore += phoneScore * weights.phone;
          weightSum += weights.phone;
        }

        if (recA.cleanEmail && recB.cleanEmail) {
          const emailScore = recA.cleanEmail === recB.cleanEmail ? 1.0 : jaroWinklerSimilarity(recA.cleanEmail, recB.cleanEmail);
          breakdown.push({ attribute: "email", score: emailScore, weight: weights.email, algorithm: "Exact/JaroWinkler" });
          weightedScore += emailScore * weights.email;
          weightSum += weights.email;
        }

        matchConfidence = weightSum > 0 ? Number((weightedScore / weightSum).toFixed(4)) : 0;
      }

      // Action routing based on confidence score
      if (matchConfidence >= autoMergeThreshold) {
        uf.union(recA._id, recB._id);
        pairwiseMatches.push({ recA, recB, matchConfidence, matchType });
      } else if (matchConfidence >= reviewQueueMinThreshold && matchConfidence < autoMergeThreshold) {
        reviewQueueItems.push({
          reviewId: `REV-${recA.sourceCustomerId}-${recB.sourceCustomerId}-${Date.now()}`,
          sourceRecordA: {
            sourceCustomerId: recA.sourceCustomerId,
            sourceSystem: recA.sourceSystem,
            recordRef: recA._id,
            snapshot: recA.rawAttributes
          },
          sourceRecordB: {
            sourceCustomerId: recB.sourceCustomerId,
            sourceSystem: recB.sourceSystem,
            recordRef: recB._id,
            snapshot: recB.rawAttributes
          },
          matchConfidence,
          matchBreakdown: breakdown,
          ambiguityReason: `Borderline similarity score (${(matchConfidence * 100).toFixed(1)}%) requires manual verification.`,
          status: "PENDING"
        });
      }
    }
  }

  // Group Records into Clusters by Root Component
  const clusters = new Map();
  normalizedRecords.forEach((rec) => {
    const rootId = uf.find(rec._id);
    if (!clusters.has(rootId)) {
      clusters.set(rootId, []);
    }
    clusters.get(rootId).push(rec);
  });

  // Create or Update Master Golden Customer Records
  const createdGoldenRecords = [];
  let goldenCustomerCounter = await GoldenCustomer.countDocuments();

  for (const [rootId, clusterRecords] of clusters.entries()) {
    const primaryPan = clusterRecords.find((r) => r.cleanPan)?.cleanPan || "";
    const primaryName = clusterRecords.find((r) => r.rawAttributes?.fullName)?.rawAttributes?.fullName || "Unspecified";
    const primaryEmail = clusterRecords.find((r) => r.cleanEmail)?.cleanEmail || "";
    const primaryPhone = clusterRecords.find((r) => r.cleanPhone)?.cleanPhone || "";
    const city = clusterRecords.find((r) => r.rawAttributes?.city)?.rawAttributes?.city || "";
    const trv = calculateTRVForCluster(clusterRecords);

    // Check if any source record in this cluster is already linked to a Golden Customer
    const existingLinkedRecord = clusterRecords.find((r) => r.linkageStatus?.goldenCustomerId);
    let existingGoldenDoc = null;

    if (primaryPan) {
      existingGoldenDoc = await GoldenCustomer.findOne({ "primaryIdentifiers.pan": primaryPan });
    } else if (existingLinkedRecord) {
      existingGoldenDoc = await GoldenCustomer.findById(existingLinkedRecord.linkageStatus.goldenCustomerId);
    }

    // Determine goldenCustomerId
    let goldenId = existingGoldenDoc?.goldenCustomerId;
    if (!goldenId) {
      goldenCustomerCounter += 1;
      goldenId = `GC_${1000 + goldenCustomerCounter}`;
    }

    const linkedSourceRecords = clusterRecords.map((r) => ({
      sourceSystem: r.sourceSystem,
      sourceCustomerId: r.sourceCustomerId,
      sourceRecordRef: r._id,
      matchType: primaryPan && r.cleanPan === primaryPan ? "DETERMINISTIC" : "PROBABILISTIC",
      confidenceScore: primaryPan && r.cleanPan === primaryPan ? 1.0 : 0.88,
      linkedAt: new Date()
    }));

    const queryCondition = existingGoldenDoc
      ? { _id: existingGoldenDoc._id }
      : primaryPan
      ? { "primaryIdentifiers.pan": primaryPan }
      : { goldenCustomerId: goldenId };

    const goldenDoc = await GoldenCustomer.findOneAndUpdate(
      queryCondition,
      {
        $set: {
          goldenCustomerId: goldenId,
          primaryIdentifiers: { pan: primaryPan },
          personalProfile: {
            fullName: primaryName,
            primaryEmail,
            primaryPhone,
            city
          },
          linkedSourceRecords,
          totalRelationshipValue: trv,
          status: "ACTIVE"
        }
      },
      { upsert: true, new: true }
    );

    // Update linkageStatus on source records
    await SourceCustomer.updateMany(
      { _id: { $in: clusterRecords.map((r) => r._id) } },
      {
        $set: {
          linkageStatus: {
            status: "LINKED",
            goldenCustomerId: goldenDoc._id,
            linkedAt: new Date(),
            confidenceScore: 1.0,
            matchReason: primaryPan ? "DETERMINISTIC_PAN_RESOLUTION" : "FUZZY_CLUSTER_RESOLUTION"
          }
        }
      }
    );

    createdGoldenRecords.push(goldenDoc);
  }

  // Populate Review Queue items in database
  let insertedReviewQueueCount = 0;
  if (reviewQueueItems.length > 0) {
    for (const item of reviewQueueItems) {
      await ReviewQueue.findOneAndUpdate(
        {
          "sourceRecordA.sourceCustomerId": item.sourceRecordA.sourceCustomerId,
          "sourceRecordB.sourceCustomerId": item.sourceRecordB.sourceCustomerId
        },
        item,
        { upsert: true, new: true }
      );
      insertedReviewQueueCount++;
    }
  }

  // Audit Log
  await AuditLog.create({
    auditId: `AUD-RES-${Date.now()}`,
    action: "RECORD_INGESTION",
    performedBy: {
      userId: "SYSTEM_PIPELINE",
      userName: "Identity Resolution Engine",
      userRole: "SYSTEM"
    },
    targetEntity: {
      entityType: "GOLDEN_CUSTOMER"
    },
    changes: {
      before: { totalSourceRecords: sourceRecords.length },
      after: {
        goldenCustomerCount: createdGoldenRecords.length,
        reviewQueueCount: insertedReviewQueueCount
      }
    },
    reason: "Executed end-to-end identity resolution, DSU clustering, and TRV calculation pipeline"
  });

  return {
    message: "Identity resolution pipeline executed successfully.",
    processedRecordsCount: sourceRecords.length,
    goldenCustomerCount: createdGoldenRecords.length,
    reviewQueueCount: insertedReviewQueueCount,
    goldenRecords: createdGoldenRecords
  };
};

export default {
  cleanPhone,
  cleanEmail,
  cleanName,
  cleanPan,
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  tokenSetRatio,
  UnionFind,
  calculateTRVForCluster,
  processIdentityResolution
};
