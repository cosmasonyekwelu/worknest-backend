import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const notificationValidation = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z.coerce.boolean().optional(),
    unreadOnly: z.coerce.boolean().optional(),
  }).transform((value) => ({
    ...value,
    isRead: typeof value.isRead === "boolean"
      ? value.isRead
      : value.unreadOnly === true
        ? false
        : undefined,
  })),
  idParam: z.object({
    id: objectId,
  }),
  broadcast: z.object({
    type: z.enum([
      "application_submitted",
      "application_status_changed",
      "new_application_admin",
      "job_expiring",
    ]),
    title: z.string().trim().min(3).max(140),
    message: z.string().trim().min(3).max(1000),
    data: z.object({
      jobId: objectId.optional(),
      applicationId: objectId.optional(),
    }).default({}),
  }),
};
