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

/**
 * Resolves attribute conflicts across source records in a cluster.
 * Evaluates competing values for fullName, primaryEmail, primaryPhone using
 * SOURCE_PRECEDENCE (system hierarchy) or RECENCY.
 */
export const resolveAttributeConflicts = (clusterRecords = [], configOptions = {}) => {
  if (!Array.isArray(clusterRecords) || clusterRecords.length <= 1) {
    return [];
  }

  const systemPrecedence = configOptions.sourcePrecedence || [
    "LOANS",
    "INSURANCE",
    "MUTUAL_FUNDS",
    "WEALTH",
    "EQUITY"
  ];

  const getPrecedenceRank = (sys) => systemPrecedence.indexOf(sys?.toUpperCase());

  const attributesToEvaluate = [
    { key: "fullName", getVal: (r) => r.rawAttributes?.fullName || r.cleanName },
    { key: "primaryEmail", getVal: (r) => r.rawAttributes?.email || r.cleanEmail },
    { key: "primaryPhone", getVal: (r) => r.rawAttributes?.phone || r.rawAttributes?.mobile || r.cleanPhone }
  ];

  const attributeConflicts = [];

  for (const attrDef of attributesToEvaluate) {
    const competingEntries = [];

    for (const rec of clusterRecords) {
      const val = attrDef.getVal(rec);
      if (val && String(val).trim() !== "") {
        competingEntries.push({
          value: String(val).trim(),
          sourceSystem: rec.sourceSystem || "UNKNOWN",
          record: rec,
          createdAt: rec.createdAt ? new Date(rec.createdAt) : new Date(0),
          updatedAt: rec.updatedAt ? new Date(rec.updatedAt) : new Date(0)
        });
      }
    }

    const uniqueValuesMap = new Map();
    for (const entry of competingEntries) {
      const normalizedKey = entry.value.toLowerCase();
      if (!uniqueValuesMap.has(normalizedKey)) {
        uniqueValuesMap.set(normalizedKey, entry);
      }
    }

    if (uniqueValuesMap.size > 1) {
      const competingValues = Array.from(uniqueValuesMap.values()).map((e) => ({
        value: e.value,
        sourceSystem: e.sourceSystem,
        confidence: 1.0
      }));

      const candidateRanks = Array.from(uniqueValuesMap.values()).map((e) => getPrecedenceRank(e.sourceSystem));
      const hasDistinctPrecedence = new Set(candidateRanks).size > 1;

      let winningEntry;
      let resolutionMethod;

      if (hasDistinctPrecedence) {
        winningEntry = Array.from(uniqueValuesMap.values()).reduce((best, curr) => {
          return getPrecedenceRank(curr.sourceSystem) > getPrecedenceRank(best.sourceSystem) ? curr : best;
        });
        resolutionMethod = "SOURCE_PRECEDENCE";
      } else {
        winningEntry = Array.from(uniqueValuesMap.values()).reduce((best, curr) => {
          const currTime = curr.updatedAt.getTime() || curr.createdAt.getTime();
          const bestTime = best.updatedAt.getTime() || best.createdAt.getTime();
          return currTime >= bestTime ? curr : best;
        });
        resolutionMethod = "RECENCY";
      }

      attributeConflicts.push({
        attribute: attrDef.key,
        competingValues,
        resolvedValue: winningEntry.value,
        resolutionMethod,
        status: "RESOLVED"
      });
    }
  }

  return attributeConflicts;
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

      // Hard / Deterministic PAN Match check with Name and Email Discrepancy Evaluation
      if (recA.cleanPan && recB.cleanPan && recA.cleanPan === recB.cleanPan) {
        const nameScore = (recA.cleanName && recB.cleanName) ? tokenSetRatio(recA.cleanName, recB.cleanName) : 1.0;
        const emailScore = (recA.cleanEmail && recB.cleanEmail) ? (recA.cleanEmail === recB.cleanEmail ? 1.0 : jaroWinklerSimilarity(recA.cleanEmail, recB.cleanEmail)) : 1.0;

        const isNameDifferent = recA.cleanName && recB.cleanName && (recA.cleanName !== recB.cleanName || nameScore < 0.85);
        const isEmailDifferent = recA.cleanEmail && recB.cleanEmail && (recA.cleanEmail !== recB.cleanEmail || emailScore < 0.85);

        // Put for review when PAN is identical but Name and/or Email are different
        if (isNameDifferent && isEmailDifferent) {
          matchConfidence = 0.70;
          matchType = "REVIEW_REQUIRED";
          breakdown.push({ attribute: "pan", score: 1.0, weight: weights.pan, algorithm: "ExactMatch" });
          breakdown.push({ attribute: "fullName", score: nameScore, weight: weights.fullName, algorithm: "TokenSetRatio" });
          breakdown.push({ attribute: "email", score: emailScore, weight: weights.email, algorithm: "Exact/JaroWinkler" });
        } else if (isNameDifferent || isEmailDifferent) {
          matchConfidence = 0.75;
          matchType = "REVIEW_REQUIRED";
          breakdown.push({ attribute: "pan", score: 1.0, weight: weights.pan, algorithm: "ExactMatch" });
          breakdown.push({ attribute: "fullName", score: nameScore, weight: weights.fullName, algorithm: "TokenSetRatio" });
          breakdown.push({ attribute: "email", score: emailScore, weight: weights.email, algorithm: "Exact/JaroWinkler" });
        } else {
          matchConfidence = 1.0;
          matchType = "DETERMINISTIC";
          breakdown.push({ attribute: "pan", score: 1.0, weight: weights.pan, algorithm: "ExactMatch" });
        }
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
        const conflicts = [];

        if (recA.cleanPan && recB.cleanPan && recA.cleanPan !== recB.cleanPan) {
          conflicts.push({
            conflictOn: "PAN",
            conflictType: "HARD",
            actualConflict: {
              recordAValue: recA.rawAttributes?.pan || recA.cleanPan,
              recordBValue: recB.rawAttributes?.pan || recB.cleanPan
            }
          });
        }

        if (recA.cleanName && recB.cleanName && recA.cleanName !== recB.cleanName) {
          conflicts.push({
            conflictOn: "NAME",
            conflictType: "SOFT",
            actualConflict: {
              recordAValue: recA.rawAttributes?.fullName || recA.cleanName,
              recordBValue: recB.rawAttributes?.fullName || recB.cleanName
            }
          });
        }

        if (recA.cleanEmail && recB.cleanEmail && recA.cleanEmail !== recB.cleanEmail) {
          conflicts.push({
            conflictOn: "EMAIL",
            conflictType: "SOFT",
            actualConflict: {
              recordAValue: recA.rawAttributes?.email || recA.cleanEmail,
              recordBValue: recB.rawAttributes?.email || recB.cleanEmail
            }
          });
        }

        if (recA.cleanPhone && recB.cleanPhone && recA.cleanPhone !== recB.cleanPhone) {
          conflicts.push({
            conflictOn: "PHONE",
            conflictType: "SOFT",
            actualConflict: {
              recordAValue: recA.rawAttributes?.phone || recA.rawAttributes?.mobile || recA.cleanPhone,
              recordBValue: recB.rawAttributes?.phone || recB.rawAttributes?.mobile || recB.cleanPhone
            }
          });
        }

        const hasPanMatch = recA.cleanPan && recB.cleanPan && recA.cleanPan === recB.cleanPan;
        const ambiguityReason = hasPanMatch
          ? `Identical PAN '${recA.cleanPan}' detected, but Name and Email differ across source systems (${(matchConfidence * 100).toFixed(1)}% match).`
          : `Borderline similarity score (${(matchConfidence * 100).toFixed(1)}%) requires manual verification.`;

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
          confidenceScore: matchConfidence,
          conflicts,
          ambiguityReason,
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

    // Build domain holdings arrays for GoldenCustomer schema
    const equityAccounts = [];
    const loanAccounts = [];
    const insurancePolicies = [];
    const mfInvestments = [];
    const wealthPortfolios = [];

    for (const r of clusterRecords) {
      const dHoldings = r.domainHoldings || {};
      const hData = r.holdingsData || {};

      if (dHoldings.equityHoldings && dHoldings.equityHoldings.length > 0) {
        equityAccounts.push(...dHoldings.equityHoldings);
      } else if (r.sourceSystem === "EQUITY" && Object.keys(hData).length > 0) {
        equityAccounts.push(hData);
      }

      if (dHoldings.loans && dHoldings.loans.length > 0) {
        loanAccounts.push(...dHoldings.loans);
      } else if (r.sourceSystem === "LOANS" && Object.keys(hData).length > 0) {
        loanAccounts.push(hData);
      }

      if (dHoldings.mfHoldings && dHoldings.mfHoldings.length > 0) {
        mfInvestments.push(...dHoldings.mfHoldings);
      } else if (r.sourceSystem === "MUTUAL_FUNDS" && Object.keys(hData).length > 0) {
        mfInvestments.push(hData);
      }

      if (dHoldings.wealthHoldings && dHoldings.wealthHoldings.length > 0) {
        wealthPortfolios.push(...dHoldings.wealthHoldings);
      } else if (r.sourceSystem === "WEALTH" && Object.keys(hData).length > 0) {
        wealthPortfolios.push(hData);
      }

      const policiesSource = (dHoldings.insurancePolicies && dHoldings.insurancePolicies.length > 0)
        ? dHoldings.insurancePolicies
        : (r.sourceSystem === "INSURANCE" && Object.keys(hData).length > 0 ? [hData] : []);

      for (const pol of policiesSource) {
        let rawType = (pol.policyType || pol.type || "").toUpperCase();
        let mappedType = "OTHER";
        if (rawType === "TERM" || rawType === "LIFE") mappedType = "LIFE";
        else if (rawType === "HEALTH") mappedType = "HEALTH";
        else if (rawType === "VEHICLE" || rawType === "CAR") mappedType = "CAR";
        else if (rawType === "HOME") mappedType = "HOME";
        else if (rawType === "TRAVEL") mappedType = "TRAVEL";

        let rawTier = (pol.tier || "").toUpperCase();
        let mappedTier = ["BASIC", "STANDARD", "PREMIUM"].includes(rawTier) ? rawTier : "STANDARD";

        let amt = Number(pol.amount ?? pol.sumAssured ?? pol.premiumAmount ?? 0);
        if (isNaN(amt) || amt < 0) amt = 0;

        insurancePolicies.push({
          type: mappedType,
          tier: mappedTier,
          amount: amt
        });
      }
    }

    // Assemble Provenance Ledger
    const nameRec = clusterRecords.find((r) => r.rawAttributes?.fullName);
    const emailRec = clusterRecords.find((r) => r.cleanEmail);
    const phoneRec = clusterRecords.find((r) => r.cleanPhone);
    const panRec = clusterRecords.find((r) => r.cleanPan);
    const cityRec = clusterRecords.find((r) => r.rawAttributes?.city);

    const provenance = [
      {
        field: "fullName",
        selectedValue: primaryName,
        selectedFrom: nameRec?.sourceSystem || "SYSTEM",
        values: clusterRecords
          .filter((r) => r.rawAttributes?.fullName)
          .map((r) => ({
            sourceSystem: r.sourceSystem,
            sourceCustomerId: r.sourceCustomerId,
            value: r.rawAttributes.fullName
          }))
      },
      {
        field: "primaryEmail",
        selectedValue: primaryEmail,
        selectedFrom: emailRec?.sourceSystem || "SYSTEM",
        values: clusterRecords
          .filter((r) => r.cleanEmail || r.rawAttributes?.email)
          .map((r) => ({
            sourceSystem: r.sourceSystem,
            sourceCustomerId: r.sourceCustomerId,
            value: r.rawAttributes?.email || r.cleanEmail
          }))
      },
      {
        field: "primaryPhone",
        selectedValue: primaryPhone,
        selectedFrom: phoneRec?.sourceSystem || "SYSTEM",
        values: clusterRecords
          .filter((r) => r.cleanPhone || r.rawAttributes?.mobile || r.rawAttributes?.phone)
          .map((r) => ({
            sourceSystem: r.sourceSystem,
            sourceCustomerId: r.sourceCustomerId,
            value: r.rawAttributes?.mobile || r.rawAttributes?.phone || r.cleanPhone
          }))
      },
      {
        field: "pan",
        selectedValue: primaryPan,
        selectedFrom: panRec?.sourceSystem || "SYSTEM",
        values: clusterRecords
          .filter((r) => r.cleanPan || r.rawAttributes?.pan)
          .map((r) => ({
            sourceSystem: r.sourceSystem,
            sourceCustomerId: r.sourceCustomerId,
            value: r.rawAttributes?.pan || r.cleanPan
          }))
      },
      {
        field: "city",
        selectedValue: city,
        selectedFrom: cityRec?.sourceSystem || "SYSTEM",
        values: clusterRecords
          .filter((r) => r.rawAttributes?.city)
          .map((r) => ({
            sourceSystem: r.sourceSystem,
            sourceCustomerId: r.sourceCustomerId,
            value: r.rawAttributes.city
          }))
      }
    ];

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

    const attributeConflicts = resolveAttributeConflicts(clusterRecords);

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
          attributeConflicts,
          equity: { accounts: equityAccounts },
          loans: { accounts: loanAccounts },
          insurance: { policies: insurancePolicies },
          mutualFunds: { investments: mfInvestments },
          wealth: { portfolios: wealthPortfolios },
          totalRelationshipValue: trv,
          provenance,
          matchStatus: attributeConflicts.length > 0 ? "PARTIALLY_RESOLVED" : "AUTO_MERGED",
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
  resolveAttributeConflicts,
  processIdentityResolution
};
