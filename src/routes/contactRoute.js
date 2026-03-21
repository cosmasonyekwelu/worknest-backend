import express from "express";
import { sendContactMail } from "../controllers/contact.controller.js";
import { validateFormData } from "../middleware/validateForm.js";
import { contactFormSchema } from "../lib/dataSchema.js";
import { rateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/send", rateLimiter, validateFormData(contactFormSchema), sendContactMail);

export default router;
