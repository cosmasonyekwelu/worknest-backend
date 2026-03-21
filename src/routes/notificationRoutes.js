import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotificationCtrl,
} from "../controllers/notification.controller.js";
import { verifyAuth } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { notificationValidation } from "../validation/notification.validation.js";

const router = express.Router();

router.use(verifyAuth);

router.get("/", validateRequest(notificationValidation.query, "query"), getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", validateRequest(notificationValidation.idParam, "params"), markNotificationRead);
router.patch("/read-all", markAllRead);
router.delete("/:id", validateRequest(notificationValidation.idParam, "params"), deleteNotificationCtrl);

export default router;
