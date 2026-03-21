import Notification from "../models/notification.js";
import { NotFoundError } from "../lib/errors.js";

export const createNotification = async (recipientId, type, title, message, data = {}) => {
  return Notification.create({ recipient: recipientId, type, title, message, data });
};

export const createBulkNotifications = async (recipientIds, type, title, message, data = {}) => {
  if (!recipientIds?.length) return [];

  const batchSize = 100;
  const inserted = [];

  for (let i = 0; i < recipientIds.length; i += batchSize) {
    const chunk = recipientIds.slice(i, i + batchSize).map((recipientId) => ({
      recipient: recipientId,
      type,
      title,
      message,
      data,
    }));

    const result = await Notification.insertMany(chunk);
    inserted.push(...result);
  }

  return inserted;
};

export const getUserNotifications = async (userId, page = 1, limit = 20, isRead) => {
  const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
  const safePage = Math.max(1, Number(page));
  const skip = (safePage - 1) * safeLimit;
  const query = { recipient: userId };

  if (typeof isRead === "boolean") {
    query.read = isRead;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  return {
    data: notifications,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
    unreadCount,
  };
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, read: false });
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, read: false },
    { read: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() },
  );
  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
};
