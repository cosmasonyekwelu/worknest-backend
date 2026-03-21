import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount as getUnreadCountService,
} from "../services/notification.service.js";
import { notificationValidation } from "../validation/notification.validation.js";
import { ValidationError } from "../lib/errors.js";
import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import { ZodError } from "zod";

const { successResponse } = responseHandler;

const ensureValid = (schema, payload) => {
  if (!schema) return payload;

  if (typeof schema.parse === "function") {
    try {
      return schema.parse(payload);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          "Validation failed",
          error.issues.map((issue) => ({ message: issue.message, path: issue.path.join(".") })),
        );
      }
      throw error;
    }
  }

  return payload;
};

export const getNotifications = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const query = ensureValid(notificationValidation.query, req.query);

  const result = await getUserNotifications(userId, query.page, query.limit, query.isRead);

  return successResponse(res, result, "Notifications retrieved successfully", 200);
});

export const getUnreadCount = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const unreadCount = await getUnreadCountService(userId);
  return successResponse(res, { unreadCount }, "Unread count retrieved successfully", 200);
});

export const markNotificationRead = tryCatchFn(async (req, res) => {
  const { id } = ensureValid(notificationValidation.idParam, req.params);
  const userId = req.user._id;

  const notification = await markAsRead(id, userId);

  return successResponse(res, notification, "Notification marked as read", 200);
});

export const markAllRead = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const result = await markAllAsRead(userId);

  return successResponse(res, result, "All notifications marked as read", 200);
});

export const deleteNotificationCtrl = tryCatchFn(async (req, res) => {
  const { id } = ensureValid(notificationValidation.idParam, req.params);
  const userId = req.user._id;

  await deleteNotification(id, userId);

  return successResponse(res, null, "Notification deleted", 200);
});
