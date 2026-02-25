import Notification from "../models/notification.js";

/* ================= CREATE (AUTO ONLY) ================= */
export const createNotificationService = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  relatedData = {},
  priority = "medium",
  actionUrl = null,
  io,
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    relatedData,
    priority,
    actionUrl,
  });

  const populated = await Notification.findById(notification._id)
    .populate("sender", "fullname avatar email")
    .populate("recipient", "fullname avatar email")
    .populate("relatedData.jobId", "title")
    .populate("relatedData.applicationId", "status")
    .populate("relatedData.userId", "fullname avatar");

  // Real-time emit
  if (io) {
    io.to(recipient.toString()).emit("new_notification", populated);

    const unreadCount = await Notification.countDocuments({
      recipient,
      isRead: false,
    });

    io.to(recipient.toString()).emit("unread_count", unreadCount);
  }

  return populated;
};

/* ================= GET ALL ================= */
export const getUserNotificationsService = async ({
  userId,
  page = 1,
  limit = 20,
  isRead,
}) => {
  const filter = { recipient: userId };

  if (isRead !== undefined) {
    filter.isRead = isRead;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const total = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("sender", "fullname avatar email")
    .populate("relatedData.jobId", "title")
    .populate("relatedData.applicationId", "status")
    .populate("relatedData.userId", "fullname avatar");

  return {
    notifications,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
  };
};

/* ================= GET SINGLE ================= */
export const getNotificationByIdService = async (id, userId) => {
  const notification = await Notification.findOne({
    _id: id,
    recipient: userId,
  });

  if (!notification) {
    return null;
  }

  return notification;
};

/* ================= DELETE SINGLE ================= */
export const deleteNotificationService = async (id, userId) => {
  const deleted = await Notification.findOneAndDelete({
    _id: id,
    recipient: userId,
  });

  return deleted;
};

/* ================= DELETE ALL ================= */
export const deleteAllNotificationsService = async (userId) => {
  const result = await Notification.deleteMany({
    recipient: userId,
  });

  return result.deletedCount;
};

/* ================= MARK SINGLE ================= */
export const markNotificationAsReadService = async (id, userId, io) => {
  const notification = await Notification.findOne({
    _id: id,
    recipient: userId,
  });

  if (!notification) return null;

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  if (io) {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    io.to(userId.toString()).emit("unread_count", unreadCount);
  }

  return notification;
};

/* ================= MARK ALL ================= */
export const markAllNotificationsAsReadService = async (userId, io) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true },
  );

  if (io) {
    io.to(userId.toString()).emit("unread_count", 0);
  }

  return true;
};

/* ================= UNREAD COUNT ================= */
export const getUnreadCountService = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};
