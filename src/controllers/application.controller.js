import tryCatchFn from "../lib/tryCatchFn.js";
import {
  createApplication,
  getUserApplications,
  getApplicationById,
  getAllApplications as getAllApplicationsService,
  updateApplicationStatus as updateApplicationStatusService,
  updateInternalNote as updateInternalNoteService,
  getApplicationStats as getApplicationStatsService
} from "../services/application.service.js";

import { uploadToCloudinary } from "../lib/cloudinary.js"; // Import cloudinary upload function

// Apply for a job
export const applyForJob = tryCatchFn(async (req, res) => {
  const { jobId } = req.params;
  const applicantId = req.user._id;

  if (!req.file) {
    return res.status(400).json({ status: "error", message: "Resume file is required" });
  }

  const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(fileBase64, {
      folder: 'Worknest/resumes',
      public_id: `${applicantId}_${Date.now()}`,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ status: "error", message: "Failed to upload resume. Please try again." });
  }

  const { portfolioUrl, linkedinUrl, answers, personalInfo } = req.body;

  // Parse answers
  let parsedAnswers = answers;
  if (typeof answers === 'string') {
    try {
      parsedAnswers = JSON.parse(answers);
    } catch (e) {
      return res.status(400).json({ status: "error", message: "Invalid answers format. Must be a valid JSON array." });
    }
  }

  // Parse and validate personalInfo
  if (!personalInfo) {
    return res.status(400).json({ status: "error", message: "Personal information is required" });
  }
  let parsedPersonalInfo;
  try {
    parsedPersonalInfo = JSON.parse(personalInfo);
    // Basic required field check
    const required = ['firstname', 'lastname', 'email'];
    for (const field of required) {
      if (!parsedPersonalInfo[field]?.trim()) {
        throw new Error(`${field} is required`);
      }
    }
  } catch (e) {
    return res.status(400).json({ status: "error", message: "Invalid personalInfo format or missing required fields" });
  }

  const application = await createApplication(
    applicantId,
    jobId,
    {
      resumeUrl: uploadResult.url,
      portfolioUrl: portfolioUrl?.trim(),
      linkedinUrl: linkedinUrl?.trim(),
      answers: parsedAnswers,
      personalInfo: parsedPersonalInfo, // pass snapshot of personal info
    }
  );

  const populatedApplication = await application.populate("job", "title companyName location");

  return res.status(201).json({
    status: "success",
    message: "Application submitted successfully",
    data: populatedApplication,
  });
});
// Get user's applications
export const getMyApplications = tryCatchFn(async (req, res) => {
  const applicantId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  //  Fix: Add limit cap and validation
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);

  const applications = await getUserApplications(
    applicantId,
    pageNum,
    limitNum
  );

  return res.status(200).json({
    status: "success",
    message: "Applications retrieved successfully",
    ...applications,
  });
});

// Get single application
export const getApplication = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  const application = await getApplicationById(
    id,
    userId,
    userRole
  );

  return res.status(200).json({
    status: "success",
    data: application,
  });
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

  //  Fix: Add limit cap and validation
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);

  const filters = {
    status,
    jobId,
    startDate,
    endDate,
    keyword,
    applicantId,
  };

  const applications = await getAllApplicationsService(
    filters,
    pageNum,
    limitNum
  );

  return res.status(200).json({
    status: "success",
    message: "Applications retrieved successfully",
    ...applications,
  });
});

// Admin: Update application status
export const updateApplicationStatus = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const adminId = req.user._id;

  if (!status || !status.trim()) {
    return res.status(400).json({
      status: "error",
      message: "Status is required",
    });
  }

  const application = await updateApplicationStatusService(
    id,
    status.trim(),
    adminId,
    note?.trim()
  );

  return res.status(200).json({
    status: "success",
    message: `Application status updated to ${status}`,
    data: application,
  });
});

// Admin: Update internal note
export const updateInternalNote = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note || note.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Note cannot be empty",
    });
  }

  const application = await updateInternalNoteService(id, note.trim());

  return res.status(200).json({
    status: "success",
    message: "Internal note updated successfully",
    data: application,
  });
});

// Get application statistics
export const getApplicationStats = tryCatchFn(async (req, res) => {
  const { jobId } = req.query;

  const stats = await getApplicationStatsService(jobId);

  return res.status(200).json({
    status: "success",
    data: stats,
  });
});