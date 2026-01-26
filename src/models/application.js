import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },

    resumeUrl: {
      type: String,
      required: true
    },
    resumeId: String,

    portfolioUrl: String,
    linkedinUrl: String,

    answers: [
      {
        question: String,
        answer: String
      }
    ],

    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "INTERVIEW", "OFFER", "REJECTED"],
      default: "PENDING",
      index: true
    },

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
  { timestamps: true }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
