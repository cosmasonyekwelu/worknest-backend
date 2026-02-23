import tryCatchFn from "../lib/tryCatchFn.js";
import {
  createNotificationService,
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
  deleteAllNotificationsService,
  getUnreadCountService,
  getNotificationByIdService,
} from "../services/notification.service.js";

const createNotification = tryCatchFn(async (req, res) => {
  const {
    recipient,
    sender,
    type,
    title,
    message,
    relatedData,
    priority,
    actionUrl,
  } = req.body;

  if (!recipient || !type || !title || !message) {
    return res.status(400).json({
      status: "error",
      message:
        "Please provide all required fields (recipient, type, title, message)",
    });
  }

  const validTypes = [
    "application_received",
    "application_status",
    "job_posted",
    "profile_viewed",
    "message",
    "job_alert",
    "system",
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
    });
  }

  const result = await createNotificationService({
    recipient,
    sender: sender || null,
    type,
    title,
    message,
    relatedData: relatedData || {},
    priority: priority || "medium",
    actionUrl: actionUrl || null,
  });

  return res.status(201).json(result);
});

const getUserNotifications = tryCatchFn(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const userId = req.user._id;

  const isReadFilter = isRead ? JSON.parse(isRead) : undefined;

  const result = await getUserNotificationsService({
    userId,
    page,
    limit,
    isRead: isReadFilter,
  });

  return res.status(200).json(result);
});

const getNotificationById = tryCatchFn(async (req, res) => {
  const { id } = req.params;

  const result = await getNotificationByIdService(id);

  if (result.status === "error") {
    return res.status(404).json(result);
  }

  return res.status(200).json(result);
});

const markNotificationAsRead = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await getNotificationByIdService(id);

  if (notification.status === "error") {
    return res.status(404).json({
      status: "error",
      message: "Notification not found",
    });
  }

  if (notification.data.recipient._id.toString() !== userId.toString()) {
    return res.status(403).json({
      status: "error",
      message: "You are not authorized to update this notification",
    });
  }

  const result = await markNotificationAsReadService(id);

  return res.status(200).json(result);
});

const markAllAsRead = tryCatchFn(async (req, res) => {
  const userId = req.user._id;

  const result = await markAllNotificationsAsReadService(userId);

  return res.status(200).json(result);
});

const deleteNotification = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await getNotificationByIdService(id);

  if (notification.status === "error") {
    return res.status(404).json({
      status: "error",
      message: "Notification not found",
    });
  }

  if (notification.data.recipient._id.toString() !== userId.toString()) {
    return res.status(403).json({
      status: "error",
      message: "You are not authorized to delete this notification",
    });
  }

  const result = await deleteNotificationService(id);

  return res.status(200).json(result);
});

const deleteAllNotifications = tryCatchFn(async (req, res) => {
  const userId = req.user._id;

  const result = await deleteAllNotificationsService(userId);

  return res.status(200).json(result);
});

const getUnreadCount = tryCatchFn(async (req, res) => {
  const userId = req.user._id;

  const result = await getUnreadCountService(userId);

  return res.status(200).json(result);
});

export {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
};
