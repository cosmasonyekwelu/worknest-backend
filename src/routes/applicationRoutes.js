import express from "express";
import { verifyAuth } from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import * as controller from "../controllers/application.controller.js";

const router = express.Router();

/**
 * Submit job application
 */
router.post(
  "/",
  verifyAuth,
  upload.fields([{ name: "resume", maxCount: 1 }]),
  controller.submitApplication
);

/**
 * Get current user's applications
 */
router.get("/me", verifyAuth, controller.getMyApplications);

/**
 * Get application by ID
 */
router.get("/:id", verifyAuth, controller.getApplicationById);

export default router;
