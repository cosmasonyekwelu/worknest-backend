import mongoose, { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

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

    experienceLevel: {
      type: String,
      required: true,
    },

    companyWebsite: {
      type: String,
    },

    companyLogo: {
      type: String,
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

    jobDescription: {
      type: String,
      required: true,
    },

    responsibilities: {
      type: String,
      required: true,
    },

    requirement: {
      type: String,
      required: true,
    },

    benefits: {
      type: String,
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

    companyName: {
      type: true,
      required: true,
    },
  },
  { timestamps: true },
);

const Jobs = mongoose.models.Jobs || model("Jobs", jobSchema);

export default Jobs;
