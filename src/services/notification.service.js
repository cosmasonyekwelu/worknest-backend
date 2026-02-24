import Notification from "../models/notification.js";

/* ================= CREATE ================= */
export const createNotificationService = async ({
  recipient,
  sender,
  type,
  title,
  message,
  relatedData,
  priority = "medium",
  actionUrl,
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

  return {
    status: "success",
    message: "Notification created successfully",
    data: notification,
  };
};

/* ================= GET ALL (Sender + Recipient) ================= */
export const getUserNotificationsService = async ({
  userId,
  page = 1,
  limit = 20,
  isRead,
}) => {
  const filter = {
    $or: [{ recipient: userId }, { sender: userId }],
  };

  if (isRead !== undefined) {
    filter.isRead = isRead;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const totalNotifications = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("sender", "fullname avatar email")
    .populate("recipient", "fullname avatar email")
    .populate("relatedData.jobId", "title")
    .populate("relatedData.applicationId", "status")
    .populate("relatedData.userId", "fullname avatar");

  return {
    status: "success",
    data: notifications,
    totalNotifications,
    totalPages: Math.ceil(totalNotifications / Number(limit)),
    currentPage: Number(page),
  };
};

/* ================= GET SINGLE ================= */
export const getNotificationByIdService = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId)
    .populate("sender", "fullname avatar email")
    .populate("recipient", "fullname avatar email")
    .populate("relatedData.jobId", "title")
    .populate("relatedData.applicationId", "status")
    .populate("relatedData.userId", "fullname avatar");

  if (!notification) {
    return {
      status: "error",
      message: "Notification not found",
    };
  }

  if (
    notification.recipient._id.toString() !== userId.toString() &&
    notification.sender?._id.toString() !== userId.toString()
  ) {
    return {
      status: "error",
      message: "Not authorized",
    };
  }

  return {
    status: "success",
    data: notification,
  };
};

/* ================= DELETE SINGLE ================= */
export const deleteNotificationService = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return {
      status: "error",
      message: "Notification not found",
    };
  }

  if (
    notification.recipient.toString() !== userId.toString() &&
    notification.sender?.toString() !== userId.toString()
  ) {
    return {
      status: "error",
      message: "Not authorized",
    };
  }

  await Notification.findByIdAndDelete(notificationId);

  return {
    status: "success",
    message: "Notification deleted successfully",
  };
};

/* ================= DELETE ALL ================= */
export const deleteAllNotificationsService = async (userId) => {
  const result = await Notification.deleteMany({
    $or: [{ recipient: userId }, { sender: userId }],
  });

  return {
    status: "success",
    message: "All notifications deleted successfully",
    data: { deletedCount: result.deletedCount },
  };
};

/* ================= MARK SINGLE AS READ ================= */
export const markNotificationAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return {
      status: "error",
      message: "Notification not found",
    };
  }

  if (
    notification.recipient.toString() !== userId.toString() &&
    notification.sender?.toString() !== userId.toString()
  ) {
    return {
      status: "error",
      message: "Not authorized",
    };
  }

  notification.isRead = true;
  await notification.save();

  return {
    status: "success",
    message: "Notification marked as read",
    data: notification,
  };
};

/* ================= MARK ALL AS READ ================= */
export const markAllNotificationsAsReadService = async (userId) => {
  const result = await Notification.updateMany(
    {
      $or: [{ recipient: userId }, { sender: userId }],
      isRead: false,
    },
    { isRead: true },
  );

  return {
    status: "success",
    message: "All notifications marked as read",
    data: { modifiedCount: result.modifiedCount },
  };
};

/* ================= UNREAD COUNT ================= */
export const getUnreadCountService = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    $or: [{ recipient: userId }, { sender: userId }],
    isRead: false,
  });

  return {
    status: "success",
    data: { unreadCount },
  };
};
