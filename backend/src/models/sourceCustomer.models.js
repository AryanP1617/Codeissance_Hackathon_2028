import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const sourceCustomerSchema = new mongoose.Schema(
  {
    sourceSystem: {
      type: String,
      required: true,
      enum: ["EQUITY", "MUTUAL_FUNDS", "INSURANCE", "LOANS", "WEALTH"],
      index: true
    },
    sourceCustomerId: {
      type: String,
      required: true,
      index: true
    },
    rawAttributes: {
      fullName: { type: String, trim: true },
      cleanFullName: { type: String, trim: true },
      pan: { type: String, uppercase: true, trim: true, index: true },
      mobile: { type: String, trim: true },
      cleanPhone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      cleanEmail: { type: String, lowercase: true, trim: true },
      city: { type: String, trim: true },
      dateOfBirth: { type: mongoose.Schema.Types.Mixed },
      dob: { type: Date },
      rawPayload: { type: mongoose.Schema.Types.Mixed }
    },
    holdingsData: {
      // Equity domain specific fields
      accountNumber: String,
      portfolioValue: Number,
      activeHoldings: [String],

      // Mutual Funds domain specific fields
      folioNumber: String,
      totalNavValue: Number,
      schemeCount: Number,
      sipActive: Boolean,

      // Insurance domain specific fields
      policyNumber: String,
      policyType: {
        type: String,
        enum: ["TERM", "HEALTH", "LIFE", "VEHICLE", "OTHER"]
      },
      sumAssured: Number,
      status: {
        type: String,
        enum: ["ACTIVE", "LAPSED", "EXPIRED", "CANCELLED"]
      },

      // Loans domain specific fields
      loanNumber: String,
      loanType: {
        type: String,
        enum: ["HOME", "PERSONAL", "AUTO", "BUSINESS", "EDUCATION"]
      },
      sanctionedAmount: Number,
      outstandingAmount: Number,
      emiAmount: Number,
      daysPastDue: Number,

      // Wealth domain specific fields
      aum: Number,
      pmsActive: Boolean,
      idleCash: Number
    },
    domainHoldings: {
      equityHoldings: [
        {
          symbol: String,
          companyName: String,
          isin: String,
          quantity: Number,
          averagePrice: Number,
          investedValue: Number,
          currentValue: Number,
          sector: String
        }
      ],
      mfHoldings: [
        {
          folioNumber: String,
          schemeName: String,
          schemeCode: String,
          units: Number,
          nav: Number,
          investedValue: Number,
          currentValue: Number,
          category: String,
          sipActive: Boolean
        }
      ],
      insurancePolicies: [
        {
          policyNumber: String,
          policyType: String,
          provider: String,
          sumAssured: Number,
          premiumAmount: Number,
          policyStartDate: Date,
          expiryDate: Date,
          status: String
        }
      ],
      loans: [
        {
          loanId: String,
          loanType: String,
          principalAmount: Number,
          outstandingBalance: Number,
          emiAmount: Number,
          interestRate: Number,
          tenureMonths: Number,
          status: String
        }
      ],
      wealthHoldings: [
        {
          assetId: String,
          assetType: String,
          description: String,
          investedAmount: Number,
          currentValue: Number,
          riskProfile: String
        }
      ]
    },
    linkageStatus: {
      status: {
        type: String,
        enum: ["UNLINKED", "LINKED", "FLAGGED_FOR_REVIEW"],
        default: "UNLINKED",
        index: true
      },
      goldenCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoldenCustomer",
        default: null
      },
      linkedAt: Date,
      confidenceScore: Number,
      matchReason: String
    },
    ingestedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

sourceCustomerSchema.index({ sourceSystem: 1, sourceCustomerId: 1 }, { unique: true });
sourceCustomerSchema.plugin(mongooseAggregatePaginate);

export const SourceCustomer = mongoose.model("SourceCustomer", sourceCustomerSchema);
export default SourceCustomer;
