import Jobs from "../models/jobs.js";

const searchJobService = async ({
  keyword,
  category,
  jobType,
  salaryMin,
  salaryMax,
  status,
  page = 1,
  limit = 10,
}) => {
  const filter = {};

  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { location: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { experienceLevel: { $regex: keyword, $options: "i" } },
      { jobDescription: { $regex: keyword, $options: "i" } },
    ];
  }

  if (status) filter.status = status;
  if (jobType) filter.jobType = jobType;
  if (category) filter.category = category;

  if (salaryMin) {
    filter["salaryRange.min"] = { $gte: Number(salaryMin) };
  }

  if (salaryMax) {
    filter["salaryRange.max"] = { $lte: Number(salaryMax) };
  }

  // console.log("FILTER USED:", filter);

  let sort = "-createdAt";

  const skip = (Number(page) - 1) * Number(limit);

  const totalJobs = await Jobs.countDocuments(filter);
  const jobs = await Jobs.find(filter).sort(sort).skip(skip).limit(limit);

  return {
    status: "success",
    data: jobs,
    totalJobs,
    page,
    totalPages: Math.ceil(totalJobs / limit),
  };
};

export { searchJobService };
