import express from "express";

import {
  createJobs,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  saveJobs,
  unsaveJob,
  getSavedJobs,
  uploadJobAvatarController,
} from "../controllers/job.controller.js";
import {
  authorizedRoles,
  verifyAuth,
  optionalAuth,
} from "../middleware/authenticate.js";

const router = express.Router();

router.post("/create", verifyAuth, authorizedRoles("admin"), createJobs);
router.patch("/:id/update", verifyAuth, authorizedRoles("admin"), updateJob);
router.delete("/:id/delete", verifyAuth, authorizedRoles("admin"), deleteJob);

router.get("/all", optionalAuth, getJobs);

router.get("/saved", verifyAuth, authorizedRoles("applicant"), getSavedJobs);

router.get("/:id", verifyAuth, getJobById);

router.post("/:id/save", verifyAuth, authorizedRoles("applicant"), saveJobs);
router.delete("/:id/save", verifyAuth, authorizedRoles("applicant"), unsaveJob);

router.patch(
  "/:jobId/upload-avatar",
  verifyAuth,
  authorizedRoles("admin"),
  uploadJobAvatarController,
);

export default router;
