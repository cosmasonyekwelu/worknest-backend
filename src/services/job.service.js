import Jobs from "../models/jobs.js";

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

export { searchJobService };
