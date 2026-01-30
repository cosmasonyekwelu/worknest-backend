import { searchJobService } from "../services/job.service.js";
import tryCatchFn from "../lib/tryCatchFn.js";
import Jobs from "../models/jobs.js";
import User from "../models/user.js";

const createJobs = tryCatchFn(async (req, res) => {
  const {
    title,
    location,
    jobType,
    category,
    experienceLevel,
    jobDescription,
    responsibilities,
    salaryRange,
    requirement,
    benefits,
    companyName,
    companyWebsite,
    companyLogo,
    applicationQuestions,
    status,
  } = req.body;

  if (
    !title ||
    !location ||
    !jobType ||
    !category ||
    !experienceLevel ||
    !jobDescription ||
    !responsibilities ||
    !requirement ||
    !companyName
  ) {
    return res.status(400).json({
      status: "error",
      message: "Please provide all required fields",
    });
  }

  const job = await Jobs.create({
    title,
    location,
    jobType,
    category,
    experienceLevel,
    jobDescription,
    responsibilities,
    salaryRange,
    requirement,
    benefits,
    companyName,
    companyWebsite,
    companyLogo,
    applicationQuestions,
    status,
  });

  return res.status(201).json({
    status: "success",
    message: "Job created successfully",
    data: job,
  });
});

const getJobs = tryCatchFn(async (req, res) => {
  const {
    keyword,
    location,
    jobType,
    category,
    experienceLevel,
    salaryRange,
    page,
    limit,
  } = req.query;

  const job = await searchJobService({
    keyword,
    location,
    jobType,
    category,
    experienceLevel,
    salaryRange,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });

  return res.status(200).json({
    status: "success",
    message: "Jobs fetched successfully",
    data: job,
  });
});

const getJobById = tryCatchFn(async (req, res) => {
  const job = await Jobs.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  return res.status(200).json({ status: "success", data: job });
});

const updateJob = tryCatchFn(async (req, res) => {
  const job = await Jobs.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  return res
    .status(200)
    .json({ status: "success", message: "Job updated successfully" });
});

const deleteJob = tryCatchFn(async (req, res) => {
  const job = await Jobs.findByIdAndDelete(req.params.id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  return res
    .status(200)
    .json({ status: "success", message: "Job deleted successfully" });
});

const saveJobs = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  const job = await Jobs.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  const user = await User.findById(userId);

  if (!user.savedJobs.includes(jobId)) {
    user.savedJobs.push(jobId);
    await user.save();
  }

  return res.status(200).json({
    status: "success",
    message: "Job saved successfully",
  });
});

const unsaveJob = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  const user = await User.findById(userId);

  user.savedJobs = user.savedJobs.filter(
    (id) => id.toString() !== jobId.toString(),
  );
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Job unsaved successfully",
  });
});

const getSavedJobs = tryCatchFn(async (req, res) => {
  const userId = req.user._id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const user = await User.findById(userId).populate({
    path: "savedJobs",
    options: { skip, limit, sort: { createdAt: -1 } },
  });

  const total = user.savedJobs.length;
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    status: "success",
    message: "Saved jobs fetched successfully",
    data: user.savedJobs,
    total,
    page,
    totalPages,
  });
});

export {
  createJobs,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  saveJobs,
  unsaveJob,
  getSavedJobs,
};
