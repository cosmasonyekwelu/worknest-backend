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
  uploadJobLogo,
} from "../controllers/job.controller.js";
import {
  authorizedRoles,
  verifyAuth,
  optionalAuth,
} from "../middleware/authenticate.js";

import uploadImage from "../middleware/multer.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

router.post("/create", verifyAuth, authorizedRoles("admin"), createJobs);
router.patch("/:id/update", verifyAuth, authorizedRoles("admin"), updateJob);
router.delete("/:id/delete", verifyAuth, authorizedRoles("admin"), deleteJob);

router.get("/all", optionalAuth, getJobs);

router.get("/saved", verifyAuth, authorizedRoles("applicant"), getSavedJobs);

router.get("/:id", verifyAuth, getJobById);

router.post("/:id/save", verifyAuth, authorizedRoles("applicant"), saveJobs);
router.delete("/:id/save", verifyAuth, authorizedRoles("applicant"), unsaveJob);

router.patch(
  "/:jobId/logo",
  verifyAuth,
  authorizedRoles("admin"),
  uploadImage.single("logo"),
  uploadJobLogo,
);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: "error", message: err.message });
  } else if (err) {
    return res
      .status(500)
      .json({ status: "error", message: err.message || err });
  }
  next();
});

export default router;
