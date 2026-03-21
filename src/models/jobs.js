import mongoose, { Schema, model } from "mongoose";

const urlValidator = {
  validator: (value) => !value || /^https?:\/\//i.test(value),
  message: "Must be a valid URL",
};

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    location: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    jobType: {
      type: String,
      enum: ["Full-Time", "Contract", "Part-Time", "Internship", "Freelance"],
      required: true,
      trim: true,
    },
    experienceLevel: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    companyWebsite: { type: String, trim: true, maxlength: 300, validate: urlValidator },
    avatar: { type: String, default: "", trim: true, validate: urlValidator },
    avatarId: { type: String, trim: true, maxlength: 300 },
    category: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    jobDescription: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    responsibilities: [{ type: String, trim: true, minlength: 2, maxlength: 500 }],
    requirement: [{ type: String, trim: true, minlength: 2, maxlength: 500 }],
    benefits: [{ type: String, trim: true, maxlength: 500 }],
    salaryRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    companyName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    status: { type: String, enum: ["active", "draft", "closed"], default: "draft" },
    applicationQuestions: [{ type: String, trim: true, maxlength: 300 }],
  },
  { timestamps: true },
);

jobSchema.pre("validate", function(next) {
  if (this.salaryRange && this.salaryRange.min !== undefined && this.salaryRange.max !== undefined) {
    if (this.salaryRange.min > this.salaryRange.max) {
      this.invalidate("salaryRange.min", "salaryRange.min must be less than or equal to salaryRange.max");
    }
  }
  next();
});

jobSchema.index({
  title: "text",
  jobDescription: "text",
  companyName: "text",
  location: "text",
  experienceLevel: "text",
});

jobSchema.index({ status: 1, category: 1, jobType: 1, createdAt: -1 });
jobSchema.index({ "salaryRange.min": 1, "salaryRange.max": 1 });
jobSchema.index({ createdAt: -1 });

const Jobs = mongoose.models.Jobs || model("Jobs", jobSchema);

export default Jobs;
