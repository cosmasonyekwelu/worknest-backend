import Jobs from "../models/jobs";

export const searchJobService = async ({
  keyword,
  location,
  jobType,
  category,
  experienceLevel,
  salaryRange,
  page = 1,
  limit = 10,
}) => {
  const filter = {};

  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { jobDescription: { $regex: keyword, $options: "i" } },
      { responsibilities: { $regex: keyword, $options: "i" } },
    ];
  }

  if (location) filter.location = location;
  if (jobType) filter.jobType = jobType;
  if (category) filter.category = category;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (salaryRange) filter.salaryRange = salaryRange;

  const skip = (page - 1) * limit;

  const jobs = await Jobs.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalJobs = await Jobs.countDocuments(filter);

  return {
    jobs,
    totalJobs,
    currentPage: page,
    totalPages: Math.ceil(totalJobs / limit),
  };
};
