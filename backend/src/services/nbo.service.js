import mongoose from "mongoose";
import { GoldenCustomer } from "../models/goldenCustomer.models.js";
import { SourceCustomer } from "../models/sourceCustomer.models.js";
import { NBOOpportunity } from "../models/nboOpportunity.models.js";
import { ConfigRule } from "../models/configRule.models.js";
import { AuditLog } from "../models/auditLog.models.js";

/**
 * Helper: Calculate dynamic priority score for cross-sell opportunity
 */
export const calculatePriorityScore = (baseScore, potentialValue, relationshipAgeYears = 1) => {
  let score = baseScore || 50;

  // Potential value multiplier
  if (potentialValue > 0) {
    const valueBonus = Math.min(25, Math.round(Math.log10(potentialValue + 1) * 4));
    score += valueBonus;
  }

  // Relationship age stability bonus
  if (relationshipAgeYears > 2) {
    score += Math.min(10, Math.round(relationshipAgeYears * 1.5));
  }

  return Math.min(99, Math.max(10, score));
};

/**
 * Evaluates portfolio gaps for a single Golden Customer profile
 */
export const evaluateCustomerOpportunities = async (customerDoc, activeRules = []) => {
  if (!customerDoc) return [];

  // Ensure linked source records are populated
  let populatedCustomer = customerDoc;
  if (!customerDoc.populated || !customerDoc.linkedSourceRecords?.[0]?.sourceRecordRef?.domainHoldings) {
    populatedCustomer = await GoldenCustomer.findById(customerDoc._id).populate({
      path: "linkedSourceRecords.sourceRecordRef",
      model: "SourceCustomer"
    });
  }

  if (!populatedCustomer) return [];

  const trv = populatedCustomer.totalRelationshipValue || { breakdown: {}, totalValue: 0 };
  const breakdown = trv.breakdown || {};

  const metrics = {
    equityTotal: Number(breakdown.equity || 0),
    mfTotal: Number(breakdown.mutualFunds || 0),
    insuranceTotal: Number(breakdown.insurance || 0),
    loansTotal: Number(breakdown.loans || 0),
    wealthTotal: Number(breakdown.wealth || 0),
    trvTotal: Number(trv.totalValue || 0),
    relationshipAgeYears: populatedCustomer.relationshipAgeYears || 1
  };

  const opportunitiesToCreate = [];

  // Lookup ConfigRule by rule code helper
  const getRuleRef = (code) => {
    const found = activeRules.find((r) => r.nboConfig?.ruleCode === code || r.ruleId === code);
    return found ? found._id : null;
  };

  // ==========================================
  // Rule 1: High Equity & Low Insurance Cover (INSURANCE_CROSS_SELL)
  // ==========================================
  if (metrics.equityTotal > 250000 && metrics.insuranceTotal < 100000) {
    const potentialValue = Math.round(metrics.equityTotal * 0.1);
    const priorityScore = calculatePriorityScore(70, potentialValue, metrics.relationshipAgeYears);
    const ruleId = getRuleRef("RULE_INSURANCE_GAP");

    opportunitiesToCreate.push({
      opportunityId: `OPP-INS-${populatedCustomer.goldenCustomerId}-${Date.now()}`,
      goldenCustomer: populatedCustomer._id,
      opportunityType: "INSURANCE_CROSS_SELL",
      targetProduct: "Term Life Protection Cover (1 Cr Sum Assured)",
      priorityScore,
      potentialValue,
      confidenceLevel: "HIGH",
      reasonCodes: [
        {
          code: "HIGH_EQUITY_ZERO_INSURANCE",
          description: `Customer holds ₹${metrics.equityTotal.toLocaleString()} in equity without term insurance safety net.`,
          triggerAttribute: "totalRelationshipValue.breakdown.equity",
          sourceValue: metrics.equityTotal
        }
      ],
      explainabilityLog: {
        gapIdentified: "High equity portfolio risk exposure detected without corresponding term life cover protection.",
        ruleApplied: "RULE_INSURANCE_GAP_V1",
        ruleId,
        formulaDetails: "PriorityScore = Base(70) + ValueBonus(log10(EquityVal)) + AgeBonus",
        inputMetrics: metrics
      },
      status: "GENERATED"
    });
  }

  // ==========================================
  // Rule 2: High Total Relationship Value & Zero Wealth (WEALTH_UPSELL)
  // ==========================================
  if (metrics.trvTotal > 1000000 && metrics.wealthTotal === 0) {
    const potentialValue = Math.round(metrics.trvTotal * 0.05);
    const priorityScore = calculatePriorityScore(65, potentialValue, metrics.relationshipAgeYears);
    const ruleId = getRuleRef("RULE_WEALTH_UPSELL");

    opportunitiesToCreate.push({
      opportunityId: `OPP-WLTH-${populatedCustomer.goldenCustomerId}-${Date.now()}`,
      goldenCustomer: populatedCustomer._id,
      opportunityType: "WEALTH_UPSELL",
      targetProduct: "Customized Portfolio Management Service (PMS)",
      priorityScore,
      potentialValue,
      confidenceLevel: "HIGH",
      reasonCodes: [
        {
          code: "HIGH_TRV_NO_WEALTH_HOLDING",
          description: `Total Relationship Value of ₹${metrics.trvTotal.toLocaleString()} qualifies for dedicated PMS Wealth management.`,
          triggerAttribute: "totalRelationshipValue.totalValue",
          sourceValue: metrics.trvTotal
        }
      ],
      explainabilityLog: {
        gapIdentified: "High Relationship Value exceeds ₹10L threshold suitable for Portfolio Management Advisory.",
        ruleApplied: "RULE_WEALTH_UPSELL_V1",
        ruleId,
        formulaDetails: "PriorityScore = Base(65) + ValueBonus(log10(TRV)) + AgeBonus",
        inputMetrics: metrics
      },
      status: "GENERATED"
    });
  }

  // ==========================================
  // Rule 3: Active Equity Trader without Mutual Fund SIP (MUTUAL_FUND_SIP)
  // ==========================================
  if (metrics.equityTotal > 100000 && metrics.mfTotal === 0) {
    const potentialValue = 60000; // Annual SIP potential (₹5,000/mo)
    const priorityScore = calculatePriorityScore(75, potentialValue, metrics.relationshipAgeYears);
    const ruleId = getRuleRef("RULE_MF_SIP_GAP");

    opportunitiesToCreate.push({
      opportunityId: `OPP-SIP-${populatedCustomer.goldenCustomerId}-${Date.now()}`,
      goldenCustomer: populatedCustomer._id,
      opportunityType: "MUTUAL_FUND_SIP",
      targetProduct: "Systematic Investment Plan (Index / Hybrid Funds)",
      priorityScore,
      potentialValue,
      confidenceLevel: "MEDIUM",
      reasonCodes: [
        {
          code: "ZERO_SIP_ACTIVE",
          description: "Direct equity investor missing systematic rupee-cost averaging via Mutual Fund SIPs.",
          triggerAttribute: "totalRelationshipValue.breakdown.mutualFunds",
          sourceValue: metrics.mfTotal
        }
      ],
      explainabilityLog: {
        gapIdentified: "Active equity investor lacks regular systematic mutual fund investment plan.",
        ruleApplied: "RULE_MF_SIP_GAP_V1",
        ruleId,
        formulaDetails: "PriorityScore = Base(75) + Fixed SIP Potential Bonus",
        inputMetrics: metrics
      },
      status: "GENERATED"
    });
  }

  // ==========================================
  // Rule 4: High Outstanding Loans & Equity Reserve (LOAN_REFINANCE)
  // ==========================================
  if (metrics.loansTotal > 500000 && metrics.trvTotal > 1500000) {
    const potentialValue = Math.round(metrics.loansTotal * 0.02); // Interest savings potential
    const priorityScore = calculatePriorityScore(60, potentialValue, metrics.relationshipAgeYears);
    const ruleId = getRuleRef("RULE_LOAN_REFINANCE");

    opportunitiesToCreate.push({
      opportunityId: `OPP-LOAN-${populatedCustomer.goldenCustomerId}-${Date.now()}`,
      goldenCustomer: populatedCustomer._id,
      opportunityType: "LOAN_REFINANCE",
      targetProduct: "Pre-approved Preferred Rate Home / Personal Loan Refinancing",
      priorityScore,
      potentialValue,
      confidenceLevel: "MEDIUM",
      reasonCodes: [
        {
          code: "HIGH_DEBT_REFINANCE_CANDIDATE",
          description: `Outstanding loan balance of ₹${metrics.loansTotal.toLocaleString()} eligible for preferential refinancing rate.`,
          triggerAttribute: "totalRelationshipValue.breakdown.loans",
          sourceValue: metrics.loansTotal
        }
      ],
      explainabilityLog: {
        gapIdentified: "High customer relationship value allows lowering cost of existing debt via preferential rate refinancing.",
        ruleApplied: "RULE_LOAN_REFINANCE_V1",
        ruleId,
        formulaDetails: "PriorityScore = Base(60) + Refinance Value Bonus",
        inputMetrics: metrics
      },
      status: "GENERATED"
    });
  }

  // Persist generated opportunities: Purge old GENERATED records for this customer and insert new ones
  await NBOOpportunity.deleteMany({
    goldenCustomer: populatedCustomer._id,
    status: "GENERATED"
  });

  const createdDocs = [];
  for (const oppData of opportunitiesToCreate) {
    const created = await NBOOpportunity.create(oppData);
    createdDocs.push(created);
  }

  return createdDocs;
};

/**
 * Runs live NBO evaluation across all active Golden Customer records in database
 */
export const evaluateAllGoldenCustomers = async () => {
  const [activeCustomers, activeRules] = await Promise.all([
    GoldenCustomer.find({ status: "ACTIVE" }).populate({
      path: "linkedSourceRecords.sourceRecordRef",
      model: "SourceCustomer"
    }),
    ConfigRule.find({ category: "NBO_CROSS_SELL", isActive: true }).lean()
  ]);

  if (!activeCustomers || activeCustomers.length === 0) {
    return {
      message: "No active golden customers found for NBO evaluation.",
      evaluatedCustomerCount: 0,
      opportunitiesGeneratedCount: 0
    };
  }

  let totalGenerated = 0;
  for (const customer of activeCustomers) {
    const opps = await evaluateCustomerOpportunities(customer, activeRules);
    totalGenerated += opps.length;
  }

  // Audit trail log
  await AuditLog.create({
    auditId: `AUD-NBO-EVAL-${Date.now()}`,
    action: "NBO_OVERRIDE",
    performedBy: {
      userId: "SYSTEM_NBO_ENGINE",
      userName: "Next-Best-Opportunity Engine",
      userRole: "SYSTEM"
    },
    targetEntity: {
      entityType: "NBO_OPPORTUNITY"
    },
    changes: {
      before: { evaluatedCustomerCount: activeCustomers.length },
      after: { totalOpportunitiesGenerated: totalGenerated }
    },
    reason: "Executed live portfolio gap evaluation across all active customer profiles"
  });

  return {
    message: "NBO engine evaluation completed across all customer profiles.",
    evaluatedCustomerCount: activeCustomers.length,
    opportunitiesGeneratedCount: totalGenerated
  };
};

export default {
  calculatePriorityScore,
  evaluateCustomerOpportunities,
  evaluateAllGoldenCustomers
};
