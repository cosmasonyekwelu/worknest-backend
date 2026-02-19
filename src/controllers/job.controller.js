import {
  searchJobService,
  uploadCompanyLogo,
} from "../services/job.service.js";
import { deleteFromCloudinary } from "../lib/cloudinary.js";
import responseHandler from "../lib/responseHandler.js";
import tryCatchFn from "../lib/tryCatchFn.js";
import Jobs from "../models/jobs.js";
import User from "../models/user.js";

const { successResponse, errorResponse } = responseHandler;

const uploadJobLogo = tryCatchFn(async (req, res, next) => {
  console.log("UPLOAD LOGO HIT");
  console.log("REQ.FILE:", req.file); // for debugging

  const { jobId } = req.params;

  const file = req.file;

  if (!file) {
    return next(errorResponse("No logo file uploaded", 400));
  }

  const job = await uploadCompanyLogo(jobId, file, next);

  return successResponse(res, job, "Logo uploaded successfully", 200);
});

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
    salaryMin,
    salaryMax,
    experienceLevel,
    salaryRange,
    status,
    page,
    limit,
  } = req.query;

  const safeLimit = Math.min(Number(limit) || 10, 50);

  const filters = {
    keyword,
    location,
    jobType,
    category,
    salaryMin,
    salaryMax,
    status,
    experienceLevel,
    salaryRange,
    page: Number(page) || 1,
    limit: safeLimit,
    isAdmin: req.user?.role === "admin",
  };

  if (req.user?.role === "admin" && status) {
    filters.status = status;
  }

  const job = await searchJobService(filters);

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
  const job = await Jobs.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.companyLogoId) {
    await deleteFromCloudinary(job.companyLogoId);
  }
  await job.deleteOne();

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
  let limit = Number(req.query.limit) || 10;

  if (limit > 50) limit = 50;

  const skip = (page - 1) * limit;

  const user = await User.findById(userId).select("savedJobs");

  const total = user.savedJobs.length;
  const totalPages = Math.ceil(total / limit);

  await user.populate({
    path: "savedJobs",
    options: { skip, limit, sort: { created: -1 } },
  });

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
  uploadJobLogo,
};
