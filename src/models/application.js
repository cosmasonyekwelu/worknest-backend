import mongoose, { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, "Resume is required"],
    },
    portfolioUrl: String,
    linkedinUrl: String,
    answers: [
      {
        question: String,
        answer: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "submitted",
        "in_review",
        "shortlisted",
        "interview",
        "offer",
        "rejected",
        "hired",
      ],
      default: "submitted",
    },
    internalNote: {
      type: String,
      select: false, // ❌ Fix: Changed from 'private: true' to 'select: false'
    },
    statusHistory: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// ❌ Fix: REMOVED the duplicate status history middleware
// We'll handle status history only in the service layer

// Static method to check if user has already applied
applicationSchema.statics.hasApplied = async function (applicantId, jobId) {
  const application = await this.findOne({ applicant: applicantId, job: jobId });
  return !!application;
};

const Application = mongoose.models.Application || model("Application", applicationSchema);

export default Application;