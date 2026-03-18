import Application from "../models/application.js";
import Jobs from "../models/jobs.js";
import User from "../models/user.js";

// ------------------------------------------------------------
// Create new application
// ------------------------------------------------------------
export const createApplication = async (applicantId, jobId, applicationData) => {
  try {
    // 1. Check if job exists
    const job = await Jobs.findById(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    // 2. Validate application questions if job has them
    if (job.applicationQuestions?.length) {
      if (!applicationData.answers || applicationData.answers.length !== job.applicationQuestions.length) {
        throw new Error("Please answer all application questions");
      }

      for (let i = 0; i < job.applicationQuestions.length; i++) {
        const expectedQuestion = job.applicationQuestions[i];
        const providedAnswer = applicationData.answers[i];

        if (!providedAnswer || providedAnswer.question !== expectedQuestion || !providedAnswer.answer.trim()) {
          throw new Error(`Invalid answer for question: "${expectedQuestion}"`);
        }
      }
    }

    // 3. Validate and extract personalInfo (must be provided by frontend)
    const { personalInfo, ...rest } = applicationData;
    if (!personalInfo) {
      throw new Error("Personal information is required");
    }

    // Basic required fields check (firstname, lastname, email)
    const requiredFields = ['firstname', 'lastname', 'email'];
    for (const field of requiredFields) {
      if (!personalInfo[field]?.trim()) {
        throw new Error(`${field} is required in personalInfo`);
      }
    }

    // 4. Create application with personalInfo snapshot
    const application = await Application.create({
      applicant: applicantId,
      job: jobId,
      ...rest,                       // resumeUrl, portfolioUrl, linkedinUrl, answers
      personalInfo,                   // store snapshot
      statusHistory: [{
        status: 'submitted',
        changedAt: new Date(),
        changedBy: applicantId,
        note: 'Application submitted',
      }],
    });

    return application;
  } catch (error) {
    // Handle duplicate key error (applicant already applied for this job)
    if (error.code === 11000) {
      throw new Error("You have already applied for this job");
    }
    throw error;
  }
};

// ------------------------------------------------------------
// Get applicant's own applications (paginated)
// ------------------------------------------------------------
export const getUserApplications = async (applicantId, page = 1, limit = 10) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * safeLimit;

  const [applications, total] = await Promise.all([
    Application.find({ applicant: applicantId })
      .populate("job", "title companyName location jobType createdAt")   // keep job details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Application.countDocuments({ applicant: applicantId }),
  ]);

  return {
    data: applications,   // each doc includes personalInfo
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
    query = query.select('+internalNote');
  }

  const application = await query.lean();

  if (!application) {
    throw new Error("Application not found");
  }

  // Authorization: applicant can only view their own applications
  if (role === "applicant") {
  const applicantId = application.applicant?._id?.toString?.() ?? application.applicant?.toString?.();
  const currentUserId = userId?.toString?.();

  if (!applicantId || !currentUserId || applicantId !== currentUserId) {
    throw new AppError("Unauthorized to view this application", 403);
  }
}

  return application;   // contains personalInfo
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

  // Keyword search (in applicant fullname/email or job title)
  if (keyword) {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      // Find users matching fullname or email
      const users = await User.find({
        $or: [
          { fullname: { $regex: trimmedKeyword, $options: "i" } },   //  changed from 'name' to 'fullname'
          { email: { $regex: trimmedKeyword, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map(u => u._id);

      // Find jobs matching title
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
      .select('+internalNote')
      .populate("job", "title companyName location status")   // no applicant populate
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Application.countDocuments(query),
  ]);

  return {
    data: applications,   // each doc contains personalInfo
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
    throw new Error("Invalid status");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  if (application.status === status) {
    throw new Error(`Application is already in "${status}" status`);
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
    throw new Error("Note cannot be empty");
  }

  const application = await Application.findByIdAndUpdate(
    applicationId,
    { internalNote: trimmedNote },
    { new: true, runValidators: true }
  ).select('+internalNote');

  if (!application) {
    throw new Error("Application not found");
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

// ------------------------------------------------------------
// Optional default export for easier imports in controllers
// ------------------------------------------------------------
export default {
  createApplication,
  getUserApplications,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  updateInternalNote,
  getApplicationStats,
};