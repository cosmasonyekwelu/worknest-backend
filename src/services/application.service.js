import Application from "../models/application.js";
import Jobs from "../models/jobs.js";
import User from "../models/user.js";

// Create new application
export const createApplication = async (applicantId, jobId, applicationData) => {
  try {
    // Check if job exists
    const job = await Jobs.findById(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Validate application questions if job has them
    if (job.applicationQuestions && job.applicationQuestions.length > 0) {
      if (!applicationData.answers || applicationData.answers.length !== job.applicationQuestions.length) {
        throw new Error("Please answer all application questions");
      }
      
      // ✅ Fix: Validate that answers match questions by index
      for (let i = 0; i < job.applicationQuestions.length; i++) {
        const expectedQuestion = job.applicationQuestions[i];
        const providedAnswer = applicationData.answers[i];
        
        if (!providedAnswer || providedAnswer.question !== expectedQuestion || !providedAnswer.answer.trim()) {
          throw new Error(`Invalid answer for question: "${expectedQuestion}"`);
        }
      }
    }

    // ✅ Fix: Add initial status history entry
    const application = await Application.create({
      applicant: applicantId,
      job: jobId,
      ...applicationData,
      statusHistory: [{
        status: 'submitted',
        changedAt: new Date(),
        changedBy: applicantId,
        note: 'Application submitted',
      }],
    });

    return application;
  } catch (error) {
    // ✅ Fix: Handle duplicate key error (race condition)
    if (error.code === 11000) {
      throw new Error("You have already applied for this job");
    }
    throw error;
  }
};

// Get applicant's own applications
export const getUserApplications = async (applicantId, page = 1, limit = 10) => {
  // ✅ Fix: Add limit cap for safety
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

// Get single application with authorization
export const getApplicationById = async (applicationId, userId, role) => {
  // ✅ Fix: Handle internal note based on role
  let query = Application.findById(applicationId)
    .populate("job", "title companyName location jobType requirements")
    .populate("applicant", "name email profile");

  // ✅ Fix: Use select('+internalNote') for admin
  if (role === "admin") {
    query = query.select('+internalNote');
  }

  const application = await query;

  if (!application) {
    throw new Error("Application not found");
  }

  // Authorization check
  if (role === "applicant" && application.applicant._id.toString() !== userId.toString()) {
    throw new Error("Unauthorized to view this application");
  }

  return application;
};

// Admin: Get all applications with filters
export const getAllApplications = async (filters = {}, page = 1, limit = 10) => {
  // ✅ Fix: Add limit cap for safety
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

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by job
  if (jobId) {
    query.job = jobId;
  }

  // Filter by applicant
  if (applicantId) {
    query.applicant = applicantId;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Keyword search (in applicant name/email or job title)
  if (keyword) {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      // First get user IDs matching the keyword
      const users = await User.find({
        $or: [
          { name: { $regex: trimmedKeyword, $options: "i" } },
          { email: { $regex: trimmedKeyword, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map(user => user._id);

      // Get job IDs matching the keyword
      const jobs = await Jobs.find({
        title: { $regex: trimmedKeyword, $options: "i" },
      }).select("_id");

      const jobIds = jobs.map(job => job._id);

      query.$or = [
        { applicant: { $in: userIds } },
        { job: { $in: jobIds } },
      ];
    }
  }

  const skip = (page - 1) * safeLimit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .select('+internalNote') // ✅ Fix: Include internal note for admin
      .populate("applicant", "name email profile")
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

// Update application status (admin only)
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

  // Don't update if status is the same
  if (application.status === status) {
    throw new Error(`Application is already in "${status}" status`);
  }

  // Add to status history
  application.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: adminId,
    note: note?.trim() || `Status changed to ${status}`,
  });

  application.status = status;
  // ✅ Fix: Removed manual updatedAt setting (timestamps handle this)

  await application.save();
  return application;
};

// Update internal note (admin only)
export const updateInternalNote = async (applicationId, note) => {
  const trimmedNote = note?.trim();
  
  if (!trimmedNote) {
    throw new Error("Note cannot be empty");
  }

  const application = await Application.findByIdAndUpdate(
    applicationId,
    { internalNote: trimmedNote },
    { new: true, runValidators: true }
  ).select('+internalNote'); // ✅ Fix: Include internal note in response

  if (!application) {
    throw new Error("Application not found");
  }

  return application;
};

// Get application statistics
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

  // Format to include all statuses with 0 count
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

// ✅ Fix: Removed default export since we're using named exports
// You can still export all functions as a single object if needed
export default {
  createApplication,
  getUserApplications,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  updateInternalNote,
  getApplicationStats,
};