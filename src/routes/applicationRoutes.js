import express from "express";
import { auth } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import * as controller from "../controllers/application.controller.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  upload.fields([
    { name: "resume", maxCount: 1 }
  ]),
  controller.submitApplication
);

router.get("/me", auth(), controller.getMyApplications);
router.get("/:id", auth(), controller.getApplicationById);

export default router;
