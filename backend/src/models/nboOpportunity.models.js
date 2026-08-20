import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const nboOpportunitySchema = new mongoose.Schema(
  {
    opportunityId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    goldenCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenCustomer",
      required: true,
      index: true
    },
    opportunityType: {
      type: String,
      required: true,
      enum: [
        "INSURANCE_CROSS_SELL",
        "MUTUAL_FUND_SIP",
        "WEALTH_UPSELL",
        "LOAN_REFINANCE",
        "EQUITY_DIVERSIFICATION"
      ]
    },
    targetProduct: {
      type: String,
      required: true
    },
    priorityScore: {
      type: Number,
      required: true,
      index: true
    },
    potentialValue: {
      type: Number,
      default: 0
    },
    confidenceLevel: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "HIGH"
    },
    reasonCodes: [
      {
        code: { type: String, required: true }, // e.g. "HIGH_EQUITY_ZERO_INSURANCE"
        description: { type: String, required: true },
        triggerAttribute: String,
        sourceValue: mongoose.Schema.Types.Mixed
      }
    ],
    explainabilityLog: {
      gapIdentified: { type: String, required: true },
      ruleApplied: { type: String, required: true },
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "ConfigRule" },
      formulaDetails: String,
      inputMetrics: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ["GENERATED", "ASSIGNED", "CONTACTED", "CONVERTED", "DISMISSED"],
      default: "GENERATED",
      index: true
    },
    assignedToRM: {
      rmId: String,
      rmName: String,
      assignedAt: Date
    }
  },
  {
    timestamps: true
  }
);

nboOpportunitySchema.plugin(mongooseAggregatePaginate);

export const NBOOpportunity = mongoose.model("NBOOpportunity", nboOpportunitySchema);
export default NBOOpportunity;
