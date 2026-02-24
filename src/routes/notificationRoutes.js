import express from "express";
import {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from "../controllers/notification.controller.js";
import { verifyAuth } from "../middleware/authenticate.js";

const router = express.Router();

// Create notification (admin/system)
router.post("/create", verifyAuth, createNotification);

// Get user notifications
router.get("/", verifyAuth, getUserNotifications);

// Get unread count
router.get("/unread/count", verifyAuth, getUnreadCount);

// Get single notification by ID
router.get("/:id", verifyAuth, getNotificationById);

// Mark single notification as read
router.patch("/:id/read", verifyAuth, markNotificationAsRead);

// Mark all notifications as read
router.patch("/mark/all-read", verifyAuth, markAllAsRead);

// Delete single notification
router.delete("/:id", verifyAuth, deleteNotification);

// Delete all notifications
router.delete("/", verifyAuth, deleteAllNotifications);

export default router;
