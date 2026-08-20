import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const goldenCustomerSchema = new mongoose.Schema(
  {
    goldenCustomerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    primaryIdentifiers: {
      pan: { type: String, uppercase: true, trim: true, index: true },
      aadhaarHash: { type: String, trim: true },
      passport: { type: String, uppercase: true, trim: true }
    },
    personalProfile: {
      fullName: { type: String, required: true, trim: true },
      primaryEmail: { type: String, lowercase: true, trim: true, index: true },
      primaryPhone: { type: String, trim: true, index: true },
      dob: Date,
      city: String,
      gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"],
        default: "UNSPECIFIED"
      },
      addresses: [
        {
          type: { type: String, default: "RESIDENTIAL" },
          addressLine: String,
          city: String,
          state: String,
          pincode: String,
          country: { type: String, default: "INDIA" },
          sourceSystem: String
        }
      ]
    },
    linkedSourceRecords: [
      {
        sourceSystem: {
          type: String,
          required: true,
          enum: ["EQUITY", "MUTUAL_FUNDS", "INSURANCE", "LOANS", "WEALTH"]
        },
        sourceCustomerId: { type: String, required: true },
        sourceRecordRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SourceCustomer",
          required: true
        },
        matchType: {
          type: String,
          enum: ["DETERMINISTIC", "PROBABILISTIC", "MANUAL_MERGE"],
          required: true
        },
        confidenceScore: { type: Number, required: true },
        linkedAt: { type: Date, default: Date.now }
      }
    ],
    totalRelationshipValue: {
      totalValue: { type: Number, default: 0 },
      breakdown: {
        equity: { type: Number, default: 0 },
        mutualFunds: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        loans: { type: Number, default: 0 },
        wealth: { type: Number, default: 0 }
      },
      lastCalculatedAt: { type: Date, default: Date.now }
    },
    attributeConflicts: [
      {
        attribute: { type: String, required: true },
        competingValues: [
          {
            value: mongoose.Schema.Types.Mixed,
            sourceSystem: String,
            confidence: Number,
            lastUpdated: Date
          }
        ],
        resolvedValue: mongoose.Schema.Types.Mixed,
        resolutionMethod: {
          type: String,
          enum: ["SOURCE_PRECEDENCE", "RECENCY", "MANUAL_OVERRIDE", "UNRESOLVED"],
          default: "UNRESOLVED"
        },
        status: {
          type: String,
          enum: ["PENDING", "RESOLVED", "IGNORED"],
          default: "PENDING"
        }
      }
    ],
    riskCategory: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW"
    },
    relationshipAgeYears: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "MERGED", "SPLIT_REVIEW", "INACTIVE"],
      default: "ACTIVE",
      index: true
    }
  },
  {
    timestamps: true
  }
);

goldenCustomerSchema.plugin(mongooseAggregatePaginate);

export const GoldenCustomer = mongoose.model("GoldenCustomer", goldenCustomerSchema);
export default GoldenCustomer;
