import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const reviewQueueSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sourceRecordA: {
      sourceCustomerId: { type: String, required: true },
      sourceSystem: {
        type: String,
        required: true,
        enum: ["EQUITY", "MUTUAL_FUNDS", "INSURANCE", "LOANS", "WEALTH"]
      },
      recordRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SourceCustomer",
        required: true
      },
      snapshot: mongoose.Schema.Types.Mixed
    },
    sourceRecordB: {
      sourceCustomerId: { type: String, required: true },
      sourceSystem: {
        type: String,
        required: true,
        enum: ["EQUITY", "MUTUAL_FUNDS", "INSURANCE", "LOANS", "WEALTH"]
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
    matchConfidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    matchBreakdown: [
      {
        attribute: String,
        score: Number,
        weight: Number,
        algorithm: String
      }
    ],
    ambiguityReason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED_MERGE", "REJECTED_SPLIT", "ESCALATED"],
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

export const ReviewQueue = mongoose.model("ReviewQueue", reviewQueueSchema);
export default ReviewQueue;
