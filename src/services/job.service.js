import Jobs from "../models/jobs.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";

const uploadJobAvatar = async (jobId, avatar) => {
  const job = await Jobs.findById(jobId);
  if (!job) throw new NotFoundError("Job not found");

  if (!avatar) throw new ValidationError("No avatar provided");

  if (job.avatarId) {
    await deleteFromCloudinary(job.avatarId).catch(() => null);
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
  location,
  experienceLevel,
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

  if (jobType) filter.jobType = jobType;
  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (experienceLevel) filter.experienceLevel = { $regex: experienceLevel, $options: "i" };

  const parsedSalaryMin = Number(salaryMin);
  const parsedSalaryMax = Number(salaryMax);
  if (!Number.isNaN(parsedSalaryMin) || !Number.isNaN(parsedSalaryMax)) {
    filter.$and = filter.$and || [];
    if (!Number.isNaN(parsedSalaryMax)) {
      filter.$and.push({ "salaryRange.min": { $lte: parsedSalaryMax } });
    }
    if (!Number.isNaN(parsedSalaryMin)) {
      filter.$and.push({ "salaryRange.max": { $gte: parsedSalaryMin } });
    }
  }

  let useTextSearch = false;
  if (keyword?.trim()) {
    useTextSearch = true;
    filter.$text = { $search: keyword.trim() };
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * safeLimit;

  let query = Jobs.find(filter);

  if (useTextSearch) {
    query = query
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 });
  } else {
    query = query.sort("-createdAt");
  }

  let jobs;
  try {
    jobs = await query.skip(skip).limit(safeLimit).lean();
  } catch {
    if (!keyword?.trim()) throw new Error("Failed to query jobs");
    delete filter.$text;
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { location: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { experienceLevel: { $regex: keyword, $options: "i" } },
      { jobDescription: { $regex: keyword, $options: "i" } },
    ];
    jobs = await Jobs.find(filter).sort("-createdAt").skip(skip).limit(safeLimit).lean();
  }

  const totalJobs = await Jobs.countDocuments(filter);

  return {
    data: jobs,
    totalJobs,
    page: safePage,
    totalPages: Math.ceil(totalJobs / safeLimit),
  };
};

export { searchJobService, uploadJobAvatar };
