import express from "express";
import {
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

// Get all notifications for the authenticated user
router.get("/", verifyAuth, getUserNotifications);

// Get unread notifications count
router.get("/unread/count", verifyAuth, getUnreadCount);

// Get a single notification by ID
router.get("/:id", verifyAuth, getNotificationById);

// Mark a single notification as read
router.patch("/:id/read", verifyAuth, markNotificationAsRead);

// Mark all notifications as read
router.patch("/mark/all-read", verifyAuth, markAllAsRead);

// Delete a single notification
router.delete("/:id", verifyAuth, deleteNotification);

// Delete all notifications
router.delete("/", verifyAuth, deleteAllNotifications);

export default router;
