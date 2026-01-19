import express from "express";
import { login, register } from "../controllers/user.controller.js";
import { rateLimiter } from "../middleware/rateLimit.js";
import { validateFormData } from "../middleware/validateForm.js";
import { validateSignInSchema, validateSignUpSchema } from "../lib/dataSchema.js";

const router = express.Router();

router.post("/create", validateFormData(validateSignUpSchema), register); 
router.post("/login", rateLimiter,validateFormData(validateSignInSchema) ,login); 

export default router;
