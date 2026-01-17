import express from "express";
import { login, register } from "../controllers/user.controller";
import { rateLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.post("/create", register); //needs validation middleware
router.post("/login", rateLimiter, login); //needs validation middleware

export default router;
