import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    jobType: {
      type: String,
      enum: [
        "Full Time / Permanent",
        "Contract",
        "Part Time",
        "Internship",
        "Freelance",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Information Technology",
        "Advertising/PR",
        "Media & Communication",
        "Fashion",
        "Health & Fitness",
      ],
      required: true,
    },

    salaryRange: {
      type: String,
      enum: [
        "350000-400000",
        "300000-350000",
        "250000-300000",
        "150000-200000",
        "100000-150000",
      ],
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    location: String,
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Job", jobSchema);
