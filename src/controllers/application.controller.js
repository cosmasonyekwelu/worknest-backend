import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import {
  createApplication,
  getUserApplications,
  getApplicationById,
  getAllApplications as getAllApplicationsService,
  updateApplicationStatus as updateApplicationStatusService,
  updateInternalNote as updateInternalNoteService,
  getApplicationStats as getApplicationStatsService,
  processNewApplication,
  submitInterviewAnswers,
  updateApplicationPersonalInfo,
} from "../services/application.service.js";

import { uploadToCloudinary } from "../lib/cloudinary.js";
import { createNotification, createBulkNotifications } from "../services/notification.service.js";
import User from "../models/user.js";
import Jobs from "../models/jobs.js";
import logger from "../config/logger.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";

const { successResponse } = responseHandler;

// Apply for a job
export const applyForJob = tryCatchFn(async (req, res) => {
  const { jobId } = req.params;
  const applicantId = req.user._id;

  if (!req.file) {
    throw new ValidationError("Resume file is required");
  }

  const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(fileBase64, {
      folder: "Worknest/resumes",
      public_id: `${applicantId}_${Date.now()}`,
    });
  } catch (error) {
    logger.error("Cloudinary upload error", { error: error.message });
    throw new Error("Failed to upload resume. Please try again.");
  }

  const { portfolioUrl, linkedinUrl, answers, personalInfo } = req.body;

  let parsedAnswers = answers;
  if (typeof answers === "string") {
    try {
      parsedAnswers = JSON.parse(answers);
    } catch {
      throw new ValidationError("Invalid answers format. Must be a valid JSON array.");
    }
  }

  if (!personalInfo) {
    throw new ValidationError("Personal information is required");
  }

  let parsedPersonalInfo;
  try {
    parsedPersonalInfo = typeof personalInfo === "string" ? JSON.parse(personalInfo) : personalInfo;
    const required = ["firstname", "lastname", "email"];
    for (const field of required) {
      if (!parsedPersonalInfo[field]?.trim()) {
        throw new ValidationError(`${field} is required`);
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Invalid personalInfo format or missing required fields");
  }

  const job = await Jobs.findById(jobId).select("title companyName");
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const application = await createApplication(
    applicantId,
    jobId,
    {
      resumeUrl: uploadResult.url,
      portfolioUrl: portfolioUrl?.trim(),
      linkedinUrl: linkedinUrl?.trim(),
      answers: parsedAnswers,
      personalInfo: parsedPersonalInfo,
    }
  );

  const populatedApplication = await application.populate("job", "title companyName location");

  process.nextTick(async () => {
    try {
      await processNewApplication(application._id, applicantId);
    } catch (error) {
      logger.error("Automatic AI processing failed for new application", {
        applicationId: application._id,
        error: error.message,
      });
    }

    try {
      await createNotification(
        applicantId,
        "application_submitted",
        "Application Submitted",
        `You have successfully applied for "${job.title}" at ${job.companyName}.`,
        { jobId: job._id, applicationId: application._id }
      );

      const admins = await User.find({ role: "admin" }).select("_id");
      if (admins.length > 0) {
        await createBulkNotifications(
          admins.map((a) => a._id),
          "new_application_admin",
          "New Application Received",
          `${req.user.fullname} applied for "${job.title}" at ${job.companyName}.`,
          { jobId: job._id, applicationId: application._id, applicantId }
        );
      }
    } catch (notifError) {
      logger.error("Failed to send notifications", { error: notifError.message });
    }
  });

  return successResponse(res, populatedApplication, "Application submitted successfully", 201);
});

// Get user's applications
export const getMyApplications = tryCatchFn(async (req, res) => {
  const applicantId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);

  const applications = await getUserApplications(applicantId, pageNum, limitNum);

  return successResponse(res, applications, "Applications retrieved successfully", 200);
});

// Get single application
export const getApplication = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(id, userId, userRole);

  return successResponse(res, application, "Application retrieved successfully", 200);
});

// Admin: Get all applications
export const getAllApplications = tryCatchFn(async (req, res) => {
  const {
    status,
    jobId,
    startDate,
    endDate,
    keyword,
    applicantId,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);

  const filters = { status, jobId, startDate, endDate, keyword, applicantId };

  const applications = await getAllApplicationsService(filters, pageNum, limitNum);

  return successResponse(res, applications, "Applications retrieved successfully", 200);
});

// Admin: Update application status
export const updateApplicationStatus = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const adminId = req.user._id;

  if (!status || !status.trim()) {
    throw new ValidationError("Status is required");
  }

  const application = await updateApplicationStatusService(id, status.trim(), adminId, note?.trim());

  return successResponse(res, application, `Application status updated to ${status}`, 200);
});

// Admin: Update internal note
export const updateInternalNote = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note || note.trim() === "") {
    throw new ValidationError("Note cannot be empty");
  }

  const application = await updateInternalNoteService(id, note.trim());

  return successResponse(res, application, "Internal note updated successfully", 200);
});

export const triggerManualAIReview = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const application = await processNewApplication(id, adminId);

  return successResponse(res, application, "AI review completed", 200);
});

export const submitInterview = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const applicantId = req.user._id;
  const { answers } = req.body;

  const application = await submitInterviewAnswers(id, applicantId, answers);

  return successResponse(res, application, "Interview submitted and scored", 200);
});

export const updatePersonalInfo = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;
  const { personalInfo } = req.body;

  const application = await updateApplicationPersonalInfo(id, adminId, personalInfo);

  return successResponse(res, application, "Personal info updated", 200);
});

// Get application statistics
export const getApplicationStats = tryCatchFn(async (req, res) => {
  const { jobId } = req.query;

  const stats = await getApplicationStatsService(jobId);

  return successResponse(res, stats, "Application statistics retrieved successfully", 200);
});
