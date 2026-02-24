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

/* ================= CREATE ================= */
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

/* ================= GET ALL ================= */
const getUserNotifications = tryCatchFn(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const userId = req.user._id;

  const result = await getUserNotificationsService({
    userId,
    page,
    limit,
    isRead: isRead !== undefined ? JSON.parse(isRead) : undefined,
  });

  return res.status(200).json(result);
});

/* ================= GET SINGLE ================= */
const getNotificationById = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const result = await getNotificationByIdService(id, userId);

  if (result.status === "error") {
    return res.status(403).json(result);
  }

  return res.status(200).json(result);
});

/* ================= DELETE SINGLE ================= */
const deleteNotification = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const result = await deleteNotificationService(id, userId);

  if (result.status === "error") {
    return res.status(403).json(result);
  }

  return res.status(200).json(result);
});

/* ================= DELETE ALL ================= */
const deleteAllNotifications = tryCatchFn(async (req, res) => {
  const userId = req.user._id;

  const result = await deleteAllNotificationsService(userId);

  return res.status(200).json(result);
});

/* ================= MARK ================= */
const markNotificationAsRead = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const result = await markNotificationAsReadService(id, userId);

  if (result.status === "error") {
    return res.status(403).json(result);
  }

  return res.status(200).json(result);
});

const markAllAsRead = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const result = await markAllNotificationsAsReadService(userId);
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
