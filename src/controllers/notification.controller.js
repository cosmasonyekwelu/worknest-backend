import tryCatchFn from "../lib/tryCatchFn.js";
import {
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
  deleteAllNotificationsService,
  getUnreadCountService,
  getNotificationByIdService,
} from "../services/notification.service.js";

/* ================= GET ALL ================= */
export const getUserNotifications = tryCatchFn(async (req, res) => {
  const { page, limit, isRead } = req.query;

  const result = await getUserNotificationsService({
    userId: req.user._id,
    page,
    limit,
    isRead: isRead !== undefined ? isRead === "true" : undefined,
  });

  res.status(200).json({ status: "success", ...result });
});

/* ================= GET SINGLE ================= */
export const getNotificationById = tryCatchFn(async (req, res) => {
  const notification = await getNotificationByIdService(
    req.params.id,
    req.user._id,
  );

  if (!notification) {
    return res.status(404).json({ status: "error", message: "Not found" });
  }

  res.status(200).json({ status: "success", data: notification });
});

/* ================= DELETE SINGLE ================= */
export const deleteNotification = tryCatchFn(async (req, res) => {
  const deleted = await deleteNotificationService(req.params.id, req.user._id);

  if (!deleted) {
    return res.status(404).json({ status: "error", message: "Not found" });
  }

  res.status(200).json({ status: "success", message: "Deleted successfully" });
});

/* ================= DELETE ALL ================= */
export const deleteAllNotifications = tryCatchFn(async (req, res) => {
  const count = await deleteAllNotificationsService(req.user._id);

  res.status(200).json({
    status: "success",
    message: "All deleted",
    deletedCount: count,
  });
});

/* ================= MARK SINGLE ================= */
export const markNotificationAsRead = tryCatchFn(async (req, res) => {
  const notification = await markNotificationAsReadService(
    req.params.id,
    req.user._id,
    req.app.get("io"),
  );

  if (!notification) {
    return res.status(404).json({ status: "error", message: "Not found" });
  }

  res.status(200).json({ status: "success", data: notification });
});

/* ================= MARK ALL ================= */
export const markAllAsRead = tryCatchFn(async (req, res) => {
  await markAllNotificationsAsReadService(req.user._id, req.app.get("io"));

  res.status(200).json({ status: "success", message: "All marked as read" });
});

/* ================= UNREAD COUNT ================= */
export const getUnreadCount = tryCatchFn(async (req, res) => {
  const count = await getUnreadCountService(req.user._id);

  res.status(200).json({
    status: "success",
    unreadCount: count,
  });
});
