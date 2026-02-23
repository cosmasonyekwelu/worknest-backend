import Notification from "../models/notification.js";

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
  try {
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
  } catch (error) {
    throw error;
  }
};

export const getUserNotificationsService = async ({
  userId,
  page = 1,
  limit = 20,
  isRead,
}) => {
  try {
    const filter = { recipient: userId };
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
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsReadService = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return {
        status: "error",
        message: "Notification not found",
      };
    }

    return {
      status: "success",
      message: "Notification marked as read",
      data: notification,
    };
  } catch (error) {
    throw error;
  }
};

export const markAllNotificationsAsReadService = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );

    return {
      status: "success",
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const deleteNotificationService = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return {
        status: "error",
        message: "Notification not found",
      };
    }

    return {
      status: "success",
      message: "Notification deleted successfully",
    };
  } catch (error) {
    throw error;
  }
};

export const deleteAllNotificationsService = async (userId) => {
  try {
    const result = await Notification.deleteMany({ recipient: userId });

    return {
      status: "success",
      message: "All notifications deleted successfully",
      data: {
        deletedCount: result.deletedCount,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getUnreadCountService = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      status: "success",
      data: {
        unreadCount,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getNotificationByIdService = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId)
      .populate("sender", "fullname avatar email")
      .populate("relatedData.jobId", "title")
      .populate("relatedData.applicationId", "status")
      .populate("relatedData.userId", "fullname avatar");

    if (!notification) {
      return {
        status: "error",
        message: "Notification not found",
      };
    }

    return {
      status: "success",
      data: notification,
    };
  } catch (error) {
    throw error;
  }
};
