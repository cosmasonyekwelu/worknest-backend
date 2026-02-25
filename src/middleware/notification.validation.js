// validation/notification.validation.js
import Joi from "joi";

export const notificationValidation = {
  create: Joi.object({
    title: Joi.string().max(200).required(),
    message: Joi.string().max(1000).required(),
    type: Joi.string()
      .valid(
        "job_created",
        "job_updated",
        "job_deleted",
        "application_submitted",
        "application_updated",
        "system"
      )
      .required(),
    relatedId: Joi.string().optional(),
    relatedModel: Joi.string().valid("Job", "Application").optional(),
    recipient: Joi.string().optional(), // if not provided, uses current user
  }),

  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(20),
    isRead: Joi.boolean().optional(),
  }),
};