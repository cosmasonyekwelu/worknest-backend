import { searchJobsService } from "../services/job.service.js";
import tryCatchFn from "../lib/tryCatchFn.js";
import Jobs from "../models/jobs.js";

const createJobs = tryCatchFn(async (req, res) => {
  const {
    keyword,
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
  } = req.body;

  if (
    !keyword ||
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
    keyword,
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
  });

  return res
    .status(201)
    .json({
      status: "success",
      message: "Job created successfully",
      data: job,
    });
});

const getJobs = tryCatchFn(async (req, res) => {
  const { keyword, location, jobType, category, experienceLevel, salaryRange, page, limit } =
    req.query;

  const job = await searchJobsService({
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

export { createJobs, getJobs, getJobById, updateJob, deleteJob };
