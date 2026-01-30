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
      enum: ["Full-Time", "Contract", "Part-Time", "Internship", "Freelance"],

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
      required: true,
    },

    jobDescription: {
      type: String,
      required: true,
    },

    responsibilities: {
      type: [String],
      required: true,
    },

    requirement: {
      type: [String],
      required: true,
    },

    benefits: {
      type: [String],
    },

    salaryRange: {
      min: Number,
      max: Number,
    },

    companyName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "draft", "closed"],
      default: "draft",
    },

    applicationQuestions: {
      type: [String],
    },
  },
  { timestamps: true },
);

const Jobs = mongoose.models.Jobs || model("Jobs", jobSchema);

export default Jobs;
