import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const SOURCE_SYSTEMS = [
  "EQUITY",
  "MUTUAL_FUNDS",
  "INSURANCE",
  "LOANS",
  "WEALTH"
];

const conflictSchema = new mongoose.Schema(
  {
    conflictOn: {
      type: String,
      required: true,
      enum: ["PAN", "NAME", "EMAIL", "PHONE"]
    },
    conflictType: {
      type: String,
      required: true,
      enum: ["HARD", "SOFT"]
    },
    actualConflict: {
      recordAValue: {
        type: String,
        default: null
      },
      recordBValue: {
        type: String,
        default: null
      }
    }
  },
  {
    _id: false
  }
);

const reviewQueueSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sourceRecordA: {
      sourceCustomerId: {
        type: String,
        required: true
      },
      sourceSystem: {
        type: String,
        required: true,
        enum: SOURCE_SYSTEMS
      },
      recordRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SourceCustomer",
        required: true
      },
      snapshot: mongoose.Schema.Types.Mixed
    },
    sourceRecordB: {
      sourceCustomerId: {
        type: String,
        required: true
      },
      sourceSystem: {
        type: String,
        required: true,
        enum: SOURCE_SYSTEMS
      },
      recordRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SourceCustomer"
      },
      goldenCustomerRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoldenCustomer"
      },
      snapshot: mongoose.Schema.Types.Mixed
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    conflicts: {
      type: [conflictSchema],
      default: []
    },
    ambiguityReason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED_MERGE",
        "REJECTED_SPLIT",
        "ESCALATED"
      ],
      default: "PENDING",
      index: true
    },
    reviewedBy: {
      userId: String,
      userName: String,
      userRole: String,
      reviewedAt: Date,
      notes: String
    }
  },
  {
    timestamps: true
  }
);

reviewQueueSchema.plugin(mongooseAggregatePaginate);

export const ReviewQueue = mongoose.model(
  "ReviewQueue",
  reviewQueueSchema
);

export default ReviewQueue;