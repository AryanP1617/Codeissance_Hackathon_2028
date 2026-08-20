import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const provenanceSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true
    },

    selectedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    selectedFrom: {
      type: String,
      default: null
    },

    values: [
      {
        sourceSystem: String,
        sourceCustomerId: String,
        value: mongoose.Schema.Types.Mixed
      }
    ]
  },
  {
    _id: false
  }
);

const goldenCustomerSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | GOLDEN CUSTOMER ID
    |--------------------------------------------------------------------------
    */

    goldenCustomerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    /*
    |--------------------------------------------------------------------------
    | PRIMARY IDENTIFIERS
    |--------------------------------------------------------------------------
    */

    primaryIdentifiers: {
      pan: {
        type: String,
        uppercase: true,
        trim: true,
        index: true
      },

      aadhaarHash: {
        type: String,
        trim: true
      },

      passport: {
        type: String,
        uppercase: true,
        trim: true
      }
    },

    /*
    |--------------------------------------------------------------------------
    | RESOLVED CUSTOMER PROFILE
    |--------------------------------------------------------------------------
    */

    personalProfile: {
      fullName: {
        type: String,
        required: true,
        trim: true
      },

      primaryEmail: {
        type: String,
        lowercase: true,
        trim: true,
        index: true
      },

      primaryPhone: {
        type: String,
        trim: true,
        index: true
      },

      dob: Date,

      city: String,

      gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"],
        default: "UNSPECIFIED"
      }
    },

    /*
    |--------------------------------------------------------------------------
    | LINKED SOURCE RECORDS
    |--------------------------------------------------------------------------
    */

    linkedSourceRecords: [
      {
        sourceSystem: {
          type: String,
          required: true,
          enum: [
            "EQUITY",
            "MUTUAL_FUNDS",
            "INSURANCE",
            "LOANS",
            "WEALTH"
          ]
        },

        sourceCustomerId: {
          type: String,
          required: true
        },

        sourceRecordRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SourceCustomer",
          required: true
        },

        matchType: {
          type: String,
          enum: [
            "DETERMINISTIC",
            "PROBABILISTIC",
            "MANUAL_MERGE"
          ],
          required: true
        },

        confidenceScore: {
          type: Number,
          required: true
        },

        linkedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    /*
    |--------------------------------------------------------------------------
    | EQUITY DATA
    |--------------------------------------------------------------------------
    */

    equity: {
      accounts: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
      }
    },

    /*
    |--------------------------------------------------------------------------
    | LOAN DATA
    |--------------------------------------------------------------------------
    */

    loans: {
      accounts: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
      }
    },

    /*
    |--------------------------------------------------------------------------
    | INSURANCE DATA
    |--------------------------------------------------------------------------
    */

    insurance: {
      policies: [
        {
          type: {
            type: String,
            required: true,
            enum: [
              "LIFE",
              "HEALTH",
              "CAR",
              "HOME",
              "TRAVEL",
              "OTHER"
            ]
          },

          tier: {
            type: String,
            required: true,
            enum: [
              "BASIC",
              "STANDARD",
              "PREMIUM"
            ]
          },

          amount: {
            type: Number,
            required: true,
            min: 0
          }
        }
      ]
    },

    /*
    |--------------------------------------------------------------------------
    | MUTUAL FUND DATA
    |--------------------------------------------------------------------------
    */

    mutualFunds: {
      investments: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
      }
    },

    /*
    |--------------------------------------------------------------------------
    | WEALTH DATA
    |--------------------------------------------------------------------------
    */

    wealth: {
      portfolios: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
      }
    },

    /*
    |--------------------------------------------------------------------------
    | TOTAL RELATIONSHIP VALUE
    |--------------------------------------------------------------------------
    */

    totalRelationshipValue: {
      totalValue: {
        type: Number,
        default: 0
      },

      breakdown: {
        equity: { type: Number, default: 0 },
        mutualFunds: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        loans: { type: Number, default: 0 },
        wealth: { type: Number, default: 0 }
      },

      lastCalculatedAt: {
        type: Date,
        default: Date.now
      }
    },

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CONFLICTS
    |--------------------------------------------------------------------------
    */

    attributeConflicts: [
      {
        attribute: {
          type: String,
          required: true
        },

        competingValues: [
          {
            value: mongoose.Schema.Types.Mixed,
            sourceSystem: String,
            confidence: Number
          }
        ],

        resolvedValue: mongoose.Schema.Types.Mixed,

        resolutionMethod: {
          type: String,
          enum: [
            "SOURCE_PRECEDENCE",
            "RECENCY",
            "MANUAL_OVERRIDE",
            "UNRESOLVED"
          ],
          default: "UNRESOLVED"
        },

        status: {
          type: String,
          enum: ["PENDING", "RESOLVED"],
          default: "PENDING"
        }
      }
    ],

    /*
    |--------------------------------------------------------------------------
    | PROVENANCE
    |--------------------------------------------------------------------------
    */

    provenance: {
      type: [provenanceSchema],
      default: []
    },

    /*
    |--------------------------------------------------------------------------
    | MATCH STATUS
    |--------------------------------------------------------------------------
    */

    matchStatus: {
      type: String,
      enum: ["AUTO_MERGED", "PARTIALLY_RESOLVED"],
      default: "AUTO_MERGED"
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: ["ACTIVE", "SPLIT_REVIEW", "INACTIVE"],
      default: "ACTIVE",
      index: true
    }
  },
  {
    timestamps: true
  }
);

goldenCustomerSchema.plugin(mongooseAggregatePaginate);

export const GoldenCustomer = mongoose.model(
  "GoldenCustomer",
  goldenCustomerSchema
);

export default GoldenCustomer;
