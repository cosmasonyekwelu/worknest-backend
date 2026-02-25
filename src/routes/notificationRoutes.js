import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotificationCtrl,
} from "../controllers/notification.controller.js";
import { verifyAuth } from "../middleware/authenticate.js";

const router = express.Router();

// All notification routes require authentication
router.use(verifyAuth);

router.get("/", getNotifications);                 // GET /notifications?page=1&limit=20&unreadOnly=false
router.get("/unread-count", getUnreadCount);       // GET /notifications/unread-count
router.patch("/:id/read", markNotificationRead);   // PATCH /notifications/:id/read
router.patch("/read-all", markAllRead);            // PATCH /notifications/read-all
router.delete("/:id", deleteNotificationCtrl);     // DELETE /notifications/:id

export default router;