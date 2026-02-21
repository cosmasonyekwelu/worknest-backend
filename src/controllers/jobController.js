import Job from "../models/Job.js";

export const getJobs = async (req, res, next) => {
  try {
    const {
      keyword,
      location,
      jobType,
      category,
      salaryRange,
      page = 1,
    } = req.query;

    const limit = 6;
    const skip = (page - 1) * limit;

    const query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (jobType) query.jobType = jobType;
    if (category) query.category = category;
    if (salaryRange) query.salaryRange = salaryRange;

    const jobs = await Job.find(query)
      .populate("company", "name logo location")
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      status: "success",
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error) {
    next(error);
  }
};
export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create(req.body);

    res.status(201).json({
      status: "success",
      job,
    });
  } catch (error) {
    next(error);
  }
};
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "company",
      "name logo location",
    );

    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    res.status(200).json({
      status: "success",
      job,
    });
  } catch (error) {
    next(error);
  }
};
