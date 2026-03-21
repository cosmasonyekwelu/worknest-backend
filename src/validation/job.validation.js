import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
const emptyToUndefined = (value) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const salaryRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
}).refine((data) => data.min <= data.max, {
  message: "min salary must be less than or equal to max salary",
  path: ["min"],
});

const baseJobSchema = {
  title: z.string().trim().min(3).max(120),
  location: z.string().trim().min(2).max(120),
  jobType: z.enum(["Full-Time", "Contract", "Part-Time", "Internship", "Freelance"]),
  category: z.string().trim().min(2).max(80),
  experienceLevel: z.string().trim().min(2).max(60),
  jobDescription: z.string().trim().min(20).max(5000),
  responsibilities: z.array(z.string().trim().min(2).max(500)).min(1),
  requirement: z.array(z.string().trim().min(2).max(500)).min(1),
  benefits: z.array(z.string().trim().max(500)).default([]),
  salaryRange: salaryRangeSchema,
  companyName: z.string().trim().min(2).max(120),
  companyWebsite: z.string().trim().url().or(z.literal("")).optional(),
  applicationQuestions: z.array(z.string().trim().max(300)).default([]),
  status: z.enum(["active", "draft", "closed"]).optional(),
};

export const jobValidation = {
  create: z.object({
    ...baseJobSchema,
    status: z.enum(["active", "draft", "closed"]).default("draft"),
  }),
  update: z.object(baseJobSchema).partial(),
  search: z.object({
    keyword: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    category: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
    jobType: z.preprocess(emptyToUndefined, z.enum(["Full-Time", "Contract", "Part-Time", "Internship", "Freelance"]).optional()),
    salaryMin: z.coerce.number().min(0).optional(),
    salaryMax: z.coerce.number().min(0).optional(),
    experienceLevel: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
    location: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    status: z.preprocess(emptyToUndefined, z.enum(["active", "draft", "closed"]).optional()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(10),
  }).refine((data) => {
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      return data.salaryMin <= data.salaryMax;
    }
    return true;
  }, {
    message: "salaryMin cannot be greater than salaryMax",
    path: ["salaryMin"],
  }),
  saved: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
  apply: z.object({
    answers: z.array(z.string().trim().max(1000)).default([]),
    resume: z.string().trim().url(),
    coverLetter: z.string().trim().max(5000).optional(),
    jobId: objectId,
  }),
  idParam: z.object({
    id: objectId.optional(),
    jobId: objectId.optional(),
  }).refine(data => data.id || data.jobId, {
    message: "Either id or jobId must be provided",
  }),
};
