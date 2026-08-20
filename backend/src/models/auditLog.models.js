import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "MANUAL_MERGE",
        "MANUAL_SPLIT",
        "RULE_UPDATE",
        "RECORD_INGESTION",
        "RM_DATA_ACCESS",
        "PII_UNMASK_REQUEST",
        "NBO_OVERRIDE"
      ],
      index: true
    },
    performedBy: {
      userId: { type: String, required: true },
      userName: String,
      userRole: {
        type: String,
        required: true,
        enum: ["ADMIN", "JUDGE", "RM", "COMPLIANCE_OFFICER", "SYSTEM"]
      }
    },
    targetEntity: {
      entityType: {
        type: String,
        enum: [
          "GOLDEN_CUSTOMER",
          "SOURCE_CUSTOMER",
          "REVIEW_QUEUE",
          "CONFIG_RULE",
          "NBO_OPPORTUNITY"
        ]
      },
      entityId: String
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
      delta: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.plugin(mongooseAggregatePaginate);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
