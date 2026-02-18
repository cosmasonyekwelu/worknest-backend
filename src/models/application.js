import mongoose, { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
      index: true,
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

    //NEW: Snapshot of applicant's personal info at submission time
    personalInfo: {
      firstname: { type: String, required: true },
      lastname: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      currentLocation: String, // field name without space
    },

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
      index: true,
    },
    internalNote: {
      type: String,
      select: false,
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// Index for sorting by newest
applicationSchema.index({ createdAt: -1 });

// Static method (optional)
applicationSchema.statics.hasApplied = async function (applicantId, jobId) {
  const application = await this.findOne({ applicant: applicantId, job: jobId });
  return !!application;
};

const Application = mongoose.models.Application || model("Application", applicationSchema);
export default Application;