import Jobs from "../models/jobs.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
import responseHandler from "../lib/responseHandler.js";

const { errorResponse, notFoundResponse } = responseHandler;

const uploadJobAvatar = async (jobId, avatar, next) => {
  const job = await Jobs.findById(jobId);
  if (!job) return next(notFoundResponse("Job not found"));

  if (!avatar) return next(errorResponse("No avatar provided", 400));

  if (job.avatarId) {
    await deleteFromCloudinary(job.avatarId).catch(console.error);
  }

  const { url, public_id } = await uploadToCloudinary(avatar, {
    folder: "Worknest/job-avatars",
    width: 50,
    height: 50,
    crop: "fit",
    format: "webp",
  });

  job.avatar = url || job.avatar;
  job.avatarId = public_id || job.avatarId;
  await job.save();

  return job;
};

const searchJobService = async ({
  keyword,
  category,
  jobType,
  salaryMin,
  salaryMax,
  status,
  isAdmin,
  page = 1,
  limit = 10,
}) => {
  const filter = {};

  if (isAdmin && status) {
    filter.status = status;
  } else if (!isAdmin) {
    filter.status = "active";
  }

  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { location: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { experienceLevel: { $regex: keyword, $options: "i" } },
      { jobDescription: { $regex: keyword, $options: "i" } },
    ];
  }

  if (jobType) filter.jobType = jobType;
  if (category) filter.category = category;

  if (salaryMin) {
    filter["salaryRange.min"] = { $gte: Number(salaryMin) };
  }

  if (salaryMax) {
    filter["salaryRange.max"] = { $lte: Number(salaryMax) };
  }

  let sort = "-createdAt";

  const skip = (Number(page) - 1) * Number(limit);

  const totalJobs = await Jobs.countDocuments(filter);
  const jobs = await Jobs.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    status: "success",
    data: jobs,
    totalJobs,
    page,
    totalPages: Math.ceil(totalJobs / limit),
  };
};

export { searchJobService, uploadJobAvatar };
