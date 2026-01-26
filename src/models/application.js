import mongoose from "mongoose";

/**
 * Application Schema
 * Represents a single job application submitted by a user
 */
const applicationSchema = new mongoose.Schema(
  {
    /**
     * Reference to the user who applied
     * Indexed for fast lookups when listing user applications
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /**
     * Reference to the job being applied for
     * Indexed for admin job → applications queries
     */
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },

    /**
     * Cloudinary URL of uploaded resume
     * Required field (UI enforces resume upload)
     */
    resumeUrl: {
      type: String,
      required: true
    },

    /**
     * Cloudinary public_id (used for future delete/update)
     */
    resumeId: {
      type: String
    },

    /**
     * Optional links provided by candidate
     */
    portfolioUrl: String,
    linkedinUrl: String,

    /**
     * Answers to custom application questions
     * Stored as structured data for future analytics
     */
    answers: [
      {
        question: String,
        answer: String
      }
    ],

    /**
     * Current application status
     * Must align with README/API reference
     */
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "INTERVIEW", "OFFER", "REJECTED"],
      default: "PENDING",
      index: true
    },

    /**
     * Timeline history of status transitions
     * Used by "Application Tracking" UI
     */
    timeline: [
      {
        status: String,
        at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

/**
 * Prevent duplicate applications
 * One user can only apply once per job
 */
applicationSchema.index({ user: 1, job: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
