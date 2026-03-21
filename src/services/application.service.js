import Application from "../models/application.js";
import Jobs from "../models/jobs.js";
import User from "../models/user.js";
import { NotFoundError, ValidationError, UnauthorizedError } from "../lib/errors.js";
import logger from "../config/logger.js";
import { generateInterviewQuestions, reviewApplication, scoreInterviewAnswers } from "./ai.service.js";

const AI_SHORTLIST_THRESHOLD = Number(process.env.AI_SHORTLIST_THRESHOLD || 50);

const REQUIRED_PERSONAL_INFO_FIELDS = ["firstname", "lastname", "email"];

const assertRequiredPersonalInfo = (application) => {
  const personalInfo = application?.personalInfo || {};
  const missing = REQUIRED_PERSONAL_INFO_FIELDS.filter((field) => !String(personalInfo[field] || "").trim());

  if (missing.length) {
    throw new ValidationError(
      `Missing required personal info fields: ${missing.join(", ")}. Update personal info before triggering AI review.`,
    );
  }
};

// ------------------------------------------------------------
// Create new application
// ------------------------------------------------------------
export const createApplication = async (applicantId, jobId, applicationData) => {
  try {
    const job = await Jobs.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job not found");
    }

    if (job.applicationQuestions?.length) {
      if (!applicationData.answers || applicationData.answers.length !== job.applicationQuestions.length) {
        throw new ValidationError("Please answer all application questions");
      }

      for (let i = 0; i < job.applicationQuestions.length; i++) {
        const expectedQuestion = job.applicationQuestions[i];
        const providedAnswer = applicationData.answers[i];

        if (!providedAnswer || providedAnswer.question !== expectedQuestion || !providedAnswer.answer.trim()) {
          throw new ValidationError(`Invalid answer for question: "${expectedQuestion}"`);
        }
      }
    }

    const { personalInfo, ...rest } = applicationData;
    if (!personalInfo) {
      throw new ValidationError("Personal information is required");
    }

    for (const field of REQUIRED_PERSONAL_INFO_FIELDS) {
      if (!personalInfo[field]?.trim()) {
        throw new ValidationError(`${field} is required in personalInfo`);
      }
    }

    const application = await Application.create({
      applicant: applicantId,
      job: jobId,
      ...rest,
      personalInfo,
      statusHistory: [{
        status: "submitted",
        changedAt: new Date(),
        changedBy: applicantId,
        note: "Application submitted",
      }],
    });

    return application;
  } catch (error) {
    if (error.code === 11000) {
      throw new ValidationError("You have already applied for this job");
    }
    throw error;
  }
};

export const processNewApplication = async (applicationId, actorId = null) => {
  const application = await Application.findById(applicationId).populate("job");
  if (!application) {
    throw new NotFoundError("Application not found");
  }

  assertRequiredPersonalInfo(application);

  const changedBy = actorId || application.applicant;

  application.ai_processing_status = "processing";
  application.status = "in_review";
  application.statusHistory.push({
    status: "in_review",
    changedAt: new Date(),
    changedBy,
    note: "AI review started",
  });
  await application.save();

  try {
    const aiReview = await reviewApplication(application.job, application);
    application.ai_score = aiReview.score;
    application.ai_feedback = aiReview.feedback;

    if (aiReview.score >= AI_SHORTLIST_THRESHOLD) {
      application.status = "shortlisted";
      application.statusHistory.push({
        status: "shortlisted",
        changedAt: new Date(),
        changedBy,
        note: `AI score ${aiReview.score} met threshold ${AI_SHORTLIST_THRESHOLD}`,
      });

      const interviewQuestions = await generateInterviewQuestions(application.job, application);
      application.interview_questions = interviewQuestions;
      application.status = "interview";
      application.statusHistory.push({
        status: "interview",
        changedAt: new Date(),
        changedBy,
        note: "AI interview questions generated",
      });
    } else {
      application.status = "rejected";
      application.statusHistory.push({
        status: "rejected",
        changedAt: new Date(),
        changedBy,
        note: `AI score ${aiReview.score} below threshold ${AI_SHORTLIST_THRESHOLD}`,
      });
    }

    application.ai_processing_status = "completed";
    await application.save();

    return application;
  } catch (error) {
    application.ai_processing_status = "failed";
    await application.save();

    logger.error("AI application processing failed", {
      applicationId,
      error: error.message,
    });

    throw error;
  }
};

export const submitInterviewAnswers = async (applicationId, applicantId, answers = []) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.applicant.toString() !== applicantId.toString()) {
    throw new UnauthorizedError("You can only submit answers for your own application");
  }

  if (application.status !== "interview") {
    throw new ValidationError("Interview answers can only be submitted when application status is interview");
  }

  if (!Array.isArray(application.interview_questions) || application.interview_questions.length === 0) {
    throw new ValidationError("No interview questions are available for this application");
  }

  if (!Array.isArray(answers) || answers.length !== application.interview_questions.length) {
    throw new ValidationError("Please answer all interview questions");
  }

  const merged = application.interview_questions.map((questionDoc, index) => ({
    question: questionDoc.question,
    answer: String(answers[index]?.answer || "").trim(),
  }));

  if (merged.some((item) => !item.answer)) {
    throw new ValidationError("All interview questions must have answers");
  }

  const scored = await scoreInterviewAnswers(merged);

  application.interview_questions = merged.map((item, index) => ({
    question: item.question,
    answer: item.answer,
    score: scored.scores[index],
  }));
  application.interview_score = scored.overallScore;
  application.status = "shortlisted";
  application.statusHistory.push({
    status: "shortlisted",
    changedAt: new Date(),
    changedBy: applicantId,
    note: `Interview submitted and scored ${scored.overallScore}`,
  });

  await application.save();
  return application;
};

export const updateApplicationPersonalInfo = async (applicationId, adminId, personalInfo = {}) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  const updatedPersonalInfo = {
    ...application.personalInfo,
    ...personalInfo,
  };

  for (const field of REQUIRED_PERSONAL_INFO_FIELDS) {
    if (!String(updatedPersonalInfo[field] || "").trim()) {
      throw new ValidationError(`${field} is required in personalInfo`);
    }
  }

  application.personalInfo = updatedPersonalInfo;
  application.statusHistory.push({
    status: application.status,
    changedAt: new Date(),
    changedBy: adminId,
    note: "Admin updated applicant personal info",
  });

  await application.save();
  return application;
};

// ------------------------------------------------------------
// Get applicant's own applications (paginated)
// ------------------------------------------------------------
export const getUserApplications = async (applicantId, page = 1, limit = 10) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * safeLimit;

  const [applications, total] = await Promise.all([
    Application.find({ applicant: applicantId })
      .populate("job", "title companyName location jobType createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Application.countDocuments({ applicant: applicantId }),
  ]);

  return {
    data: applications,
    total,
    page,
    totalPages: Math.ceil(total / safeLimit),
  };
};

// ------------------------------------------------------------
// Get single application with authorization
// ------------------------------------------------------------
export const getApplicationById = async (applicationId, userId, role) => {
  let query = Application.findById(applicationId)
    .populate("job", "title companyName location jobType requirements")
    .populate("applicant", "fullname email phone country");

  if (role === "admin") {
    query = query.select("+internalNote");
  }

  const application = await query.lean();

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  const applicationApplicantId = application?.applicant?._id?.toString?.() || application?.applicant?.toString?.();
  if (role === "applicant" && applicationApplicantId !== userId.toString()) {
    throw new UnauthorizedError("Unauthorized to view this application");
  }

  return application;
};

// ------------------------------------------------------------
// Admin: Get all applications with filters (paginated)
// ------------------------------------------------------------
export const getAllApplications = async (filters = {}, page = 1, limit = 10) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const {
    status,
    jobId,
    startDate,
    endDate,
    keyword,
    applicantId,
  } = filters;

  const query = {};

  if (status) query.status = status;
  if (jobId) query.job = jobId;
  if (applicantId) query.applicant = applicantId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (keyword) {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      const users = await User.find({
        $or: [
          { fullname: { $regex: trimmedKeyword, $options: "i" } },
          { email: { $regex: trimmedKeyword, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map(u => u._id);

      const jobs = await Jobs.find({
        title: { $regex: trimmedKeyword, $options: "i" },
      }).select("_id");
      const jobIds = jobs.map(j => j._id);

      query.$or = [
        { applicant: { $in: userIds } },
        { job: { $in: jobIds } },
      ];
    }
  }

  const skip = (page - 1) * safeLimit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .select("+internalNote")
      .populate("job", "title companyName location status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Application.countDocuments(query),
  ]);

  return {
    data: applications,
    total,
    page,
    totalPages: Math.ceil(total / safeLimit),
  };
};

// ------------------------------------------------------------
// Update application status (admin only)
// ------------------------------------------------------------
export const updateApplicationStatus = async (applicationId, status, adminId, note) => {
  const validStatuses = [
    "submitted",
    "in_review",
    "shortlisted",
    "interview",
    "offer",
    "rejected",
    "hired",
  ];

  if (!validStatuses.includes(status)) {
    throw new ValidationError("Invalid status");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.status === status) {
    throw new ValidationError(`Application is already in "${status}" status`);
  }

  application.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: adminId,
    note: note?.trim() || `Status changed to ${status}`,
  });

  application.status = status;
  await application.save();

  return application;
};

// ------------------------------------------------------------
// Update internal note (admin only)
// ------------------------------------------------------------
export const updateInternalNote = async (applicationId, note) => {
  const trimmedNote = note?.trim();
  if (!trimmedNote) {
    throw new ValidationError("Note cannot be empty");
  }

  const application = await Application.findByIdAndUpdate(
    applicationId,
    { internalNote: trimmedNote },
    { new: true, runValidators: true }
  ).select("+internalNote");

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  return application;
};

// ------------------------------------------------------------
// Get application statistics (optional job filter)
// ------------------------------------------------------------
export const getApplicationStats = async (jobId = null) => {
  const matchStage = {};
  if (jobId) {
    matchStage.job = jobId;
  }

  const stats = await Application.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        status: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);

  const allStatuses = [
    "submitted",
    "in_review",
    "shortlisted",
    "interview",
    "offer",
    "rejected",
    "hired",
  ];

  const statsMap = {};
  stats.forEach(stat => {
    statsMap[stat.status] = stat.count;
  });

  const formattedStats = allStatuses.map(status => ({
    status,
    count: statsMap[status] || 0,
  }));

  const total = formattedStats.reduce((sum, stat) => sum + stat.count, 0);

  return {
    total,
    byStatus: formattedStats,
  };
};

export default {
  createApplication,
  processNewApplication,
  submitInterviewAnswers,
  updateApplicationPersonalInfo,
  getUserApplications,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  updateInternalNote,
  getApplicationStats,
};
