import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import ResponseHandler from "../lib/responseHandler.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

/**
 * Submit a new job application
 * Business rules live here (NOT in controller)
 */
export const submitApplication = async ({
  userId,
  jobId,
  resumeFile,
  portfolioUrl,
  linkedinUrl,
  answers
}) => {
  // 1. Ensure job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw ResponseHandler.notFoundResponse("Job not found");
  }

  // 2. Job must be ACTIVE
  if (job.status !== "ACTIVE") {
    throw ResponseHandler.errorResponse("JOB_CLOSED", 400);
  }

  // 3. Prevent duplicate applications
  const exists = await Application.findOne({ user: userId, job: jobId });
  if (exists) {
    throw ResponseHandler.errorResponse("ALREADY_APPLIED", 409);
  }

  // 4. Upload resume to Cloudinary (using shared lib)
  const uploadResult = await uploadToCloudinary(resumeFile.buffer, {
    folder: "Worknest/resumes",
    resource_type: "raw",
  });

  // 5. Create application atomically
  const application = await Application.create({
    user: userId,
    job: jobId,
    resumeUrl: uploadResult.url,
    resumeId: uploadResult.public_id,
    portfolioUrl: portfolioUrl || null,
    linkedinUrl: linkedinUrl || null,
    answers,
    timeline: [{ status: "PENDING" }],
  });

  return application;
};

/**
 * Get applications for authenticated user
 */
export const getMyApplications = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find({ user: userId })
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments({ user: userId }),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
    },
  };
};

/**
 * Get application by ID (ownership enforced)
 */
export const getApplicationById = async (userId, applicationId) => {
  const application = await Application.findById(applicationId).populate(
    "job",
    "title company"
  );

  if (!application) {
    throw ResponseHandler.notFoundResponse("Application not found");
  }

  if (application.user.toString() !== userId.toString()) {
    throw ResponseHandler.forbiddenResponse("Forbidden");
  }

  return application;
};
