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

const router = express.Router();

// Applicant routes
router.post(
  "/:jobId/apply",
  verifyAuth,
  authorizedRoles("applicant"),
  applyForJob
);

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