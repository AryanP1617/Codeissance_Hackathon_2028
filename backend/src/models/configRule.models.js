import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const configRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ["IDENTITY_MATCHING", "SOURCE_PRECEDENCE", "NBO_CROSS_SELL"],
      index: true
    },
    ruleName: {
      type: String,
      required: true
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    matchingConfig: {
      autoMergeThreshold: { type: Number, default: 0.85 },
      reviewQueueMinThreshold: { type: Number, default: 0.60 },
      attributeWeights: {
        pan: { type: Number, default: 1.0 },
        fullName: { type: Number, default: 0.35 },
        email: { type: Number, default: 0.30 },
        phone: { type: Number, default: 0.35 },
        address: { type: Number, default: 0.20 }
      },
      fuzzyAlgorithms: {
        nameMatching: { type: String, default: "TokenSetRatio" },
        addressMatching: { type: String, default: "Levenshtein" }
      }
    },
    precedenceConfig: [
      {
        attribute: String,
        priorityOrder: [
          {
            type: String,
            enum: ["EQUITY", "MUTUAL_FUNDS", "INSURANCE", "LOANS", "WEALTH"]
          }
        ]
      }
    ],
    nboConfig: {
      ruleCode: String,
      condition: mongoose.Schema.Types.Mixed,
      targetDomain: String,
      targetProduct: String,
      baseScore: Number,
      multiplierField: String
    },
    lastUpdatedBy: {
      userId: String,
      userRole: String,
      updatedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

configRuleSchema.plugin(mongooseAggregatePaginate);

export const ConfigRule = mongoose.model("ConfigRule", configRuleSchema);
export default ConfigRule;
