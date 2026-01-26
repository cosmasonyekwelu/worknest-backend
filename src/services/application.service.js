import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";

export const submitApplication = async ({
  userId,
  jobId,
  resume,
  coverLetter,
  portfolioUrl,
  linkedinUrl,
  answers
}) => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.status !== "ACTIVE") {
    throw new ApiError(400, "JOB_CLOSED");
  }

  const exists = await Application.findOne({ user: userId, job: jobId });
  if (exists) {
    throw new ApiError(409, "ALREADY_APPLIED");
  }

  // upload first (important!)
  const resumeUpload = await uploadToCloudinary(resume.path, "resumes");

  const app = await Application.create({
    user: userId,
    job: jobId,
    resumeUrl: resumeUpload.secure_url,
    resumeId: resumeUpload.public_id,
    portfolioUrl,
    linkedinUrl,
    answers,
    timeline: [{ status: "PENDING" }]
  });

  return app;
};

export const getMyApplications = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Application.find({ user: userId })
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments({ user: userId })
  ]);

  return { data, total };
};

export const getApplicationById = async (userId, appId) => {
  const app = await Application.findById(appId).populate(
    "job",
    "title company"
  );

  if (!app) throw new ApiError(404, "NOT_FOUND");
  if (app.user.toString() !== userId.toString()) {
    throw new ApiError(403, "FORBIDDEN");
  }

  return app;
};
