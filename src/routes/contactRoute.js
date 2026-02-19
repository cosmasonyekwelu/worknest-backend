import express from "express";
import { sendContactMail } from "../controllers/contact.controller.js";
// import { validateFormData } from "../middleware/validateForm.js";
// import { contactFormSchema } from "../lib/dataSchema.js";

const router = express.Router();

router.post("/send", sendContactMail);

export default router;
