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
import { authorizedRoles, verifyAuth, optionalAuth } from "../middleware/authenticate.js";
import uploadImage from "../middleware/uploadImage.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { jobValidation } from "../validation/job.validation.js";

const router = express.Router();

router.patch(
  "/:jobId/upload-avatar",
  verifyAuth,
  authorizedRoles("admin"),
  validateRequest(jobValidation.idParam, "params"),
  uploadImage.single("avatar"),
  uploadJobAvatarController,
);

router.post(
  "/",
  verifyAuth,
  authorizedRoles("admin"),
  uploadImage.single("companyLogo"),
  validateRequest(jobValidation.create),
  createJobs,
);

router.patch(
  "/:id",
  verifyAuth,
  authorizedRoles("admin"),
  validateRequest(jobValidation.idParam, "params"),
  uploadImage.single("companyLogo"),
  validateRequest(jobValidation.update),
  updateJob,
);

router.delete(
  "/:id",
  verifyAuth,
  authorizedRoles("admin"),
  validateRequest(jobValidation.idParam, "params"),
  deleteJob,
);

router.get("/all", optionalAuth, validateRequest(jobValidation.search, "query"), getJobs);
router.get("/saved", verifyAuth, authorizedRoles("applicant"), validateRequest(jobValidation.saved, "query"), getSavedJobs);
router.get("/:id", optionalAuth, validateRequest(jobValidation.idParam, "params"), getJobById);
router.post("/:id/save", verifyAuth, authorizedRoles("applicant"), validateRequest(jobValidation.idParam, "params"), saveJobs);
router.delete("/:id/save", verifyAuth, authorizedRoles("applicant"), validateRequest(jobValidation.idParam, "params"), unsaveJob);

// backward-compatible aliases
router.post("/create", verifyAuth, authorizedRoles("admin"), uploadImage.single("companyLogo"), validateRequest(jobValidation.create), createJobs);
router.patch("/:id/update", verifyAuth, authorizedRoles("admin"), validateRequest(jobValidation.idParam, "params"), uploadImage.single("companyLogo"), validateRequest(jobValidation.update), updateJob);
router.delete("/:id/delete", verifyAuth, authorizedRoles("admin"), validateRequest(jobValidation.idParam, "params"), deleteJob);

export default router;
