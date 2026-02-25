import Notification from "../models/notification.js";
import User from "../models/user.js";

/**
 * Create a notification for a single user
 */
export const createNotification = async (recipientId, type, title, message, data = {}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    data,
  });
  return notification;
};

/**
 * Create notifications for multiple users (e.g., all admins)
 */
export const createBulkNotifications = async (recipientIds, type, title, message, data = {}) => {
  const notifications = recipientIds.map((recipientId) => ({
    recipient: recipientId,
    type,
    title,
    message,
    data,
  }));
  return await Notification.insertMany(notifications);
};

/**
 * Get paginated notifications for a user
 */
export const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * safeLimit;
  const query = { recipient: userId };
  if (unreadOnly) query.read = false;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(query),
  ]);

  return {
    data: notifications,
    total,
    page,
    totalPages: Math.ceil(total / safeLimit),
    unreadCount: unreadOnly ? total : await Notification.countDocuments({ recipient: userId, read: false }),
  };
};

/**
 * Mark a single notification as read (ownership check)
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, read: false },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new Error("Notification not found or already read");
  return notification;
};

/**
 * Mark all notifications for a user as read
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a notification (optional cleanup)
 */
export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  if (!notification) throw new Error("Notification not found");
  return notification;
};