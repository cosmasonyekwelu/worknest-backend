import tryCatchFn from "../lib/tryCatchFn.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notification.service.js";

// Get user's notifications (paginated)
export const getNotifications = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);
  const unreadFilter = unreadOnly === "true" || unreadOnly === true;

  const result = await getUserNotifications(userId, pageNum, limitNum, unreadFilter);

  res.status(200).json({
    status: "success",
    ...result,
  });
});

// Get unread count only
export const getUnreadCount = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const { unreadCount } = await getUserNotifications(userId, 1, 1, true);
  res.status(200).json({
    status: "success",
    unreadCount,
  });
});

// Mark a single notification as read
export const markNotificationRead = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await markAsRead(id, userId);

  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
    data: notification,
  });
});

// Mark all notifications as read
export const markAllRead = tryCatchFn(async (req, res) => {
  const userId = req.user._id;
  const result = await markAllAsRead(userId);

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

// Delete a notification
export const deleteNotificationCtrl = tryCatchFn(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await deleteNotification(id, userId);

  res.status(200).json({
    status: "success",
    message: "Notification deleted",
  });
});