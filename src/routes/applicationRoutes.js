import express from "express";
import {
  applyForJob,
  getMyApplications,
  getApplication,
  getAllApplications,
  updateApplicationStatus,
  updateInternalNote,
  getApplicationStats,
} from "../controllers/application.controller.js";
import { authorizedRoles, verifyAuth } from "../middleware/authenticate.js";

import upload from "../middleware/upload.js"; // Import your custom upload middleware

const router = express.Router();

// Applicant routes
router.post(
  "/:jobId/apply",
  verifyAuth,
  authorizedRoles("applicant"),
  upload.single('resume'), // Use upload middleware
  applyForJob
);

// Get current user's applications

router.get(
  "/me",
  verifyAuth,
  authorizedRoles("applicant"),
  getMyApplications
);

// Application stats overview
router.get(
  "/stats/overview",
  verifyAuth,
  authorizedRoles("admin"),
  getApplicationStats
);

// Get application by ID
router.get(
  "/:id",
  verifyAuth,
  authorizedRoles("applicant", "admin"),
  getApplication
);

// Admin routes
router.get(
  "/",
  verifyAuth,
  authorizedRoles("admin"),
  getAllApplications
);

router.patch(
  "/:id/status",
  verifyAuth,
  authorizedRoles("admin"),
  updateApplicationStatus
);

router.patch(
  "/:id/note",
  verifyAuth,
  authorizedRoles("admin"),
  updateInternalNote
);

export default router;