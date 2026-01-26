import express from "express";
import {
  authenticateUser,
  login,
  refreshAccessToken,
  register,
  resendVerificationToken,
  verifyUserAccount,
} from "../controllers/auth.controller.js";
import { rateLimiter } from "../middleware/rateLimit.js";
import { validateFormData } from "../middleware/validateForm.js";
import {
  forgotPasswordSchema,
  updatePasswordSchema,
  validateAccountSchema,
  validateResetPasswordSchema,
  validateSignInSchema,
  validateSignUpSchema,
  validateUserSchema,
} from "../lib/dataSchema.js";
import { verifyAuth, authorizedRoles } from "../middleware/authenticate.js";
import { cacheMiddleware, clearCache } from "../middleware/cache.js";
import {
  deleteAccount,
  deleteAccountAdmins,
  forgotPassword,
  getAllUsers,
  logout,
  resetPassword,
  updateUser,
  updateUserPassword,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/create", validateFormData(validateSignUpSchema), register);
router.post(
  "/login",
  rateLimiter,
  validateFormData(validateSignInSchema),
  login,
);
router.get(
  "/user",
  verifyAuth,
  cacheMiddleware("auth_user", 3600),
  authenticateUser,
);

router.post("/refresh-token", refreshAccessToken);

router.patch(
  "/verify-account",
  rateLimiter,
  verifyAuth,
  validateFormData(validateAccountSchema),
  clearCache("auth_user"),
  verifyUserAccount,
);

router.post(
  "/resend/verify-token",
  rateLimiter,
  verifyAuth,
  resendVerificationToken,
);

router.post(
  "/forgot-password",
  rateLimiter,
  validateFormData(forgotPasswordSchema),
  forgotPassword,
);

router.patch(
  "/reset-password",
  rateLimiter,
  validateFormData(validateResetPasswordSchema),
  resetPassword,
);

router.patch(
  "/update-password",
  rateLimiter,
  verifyAuth,
  validateFormData(updatePasswordSchema),
  clearCache("auth_user"),
  updateUserPassword,
);

router.patch(
  "/update-user",
  verifyAuth,
  validateFormData(validateUserSchema),
  clearCache("auth_user"),
  updateUser,
);

router.delete(
  "/delete-account",
  verifyAuth,
  clearCache("auth_user"),
  deleteAccount,
);

router.get(
  "/all",
  verifyAuth,
  authorizedRoles("admin"),
  cacheMiddleware("users", 3600),
  getAllUsers,
);

router.post("/logout", verifyAuth, clearCache("auth_user"), logout);

router.delete(
  "/:id/delete-account",
  verifyAuth,
  authorizedRoles("admin"),
  clearCache("users"),
  deleteAccountAdmins,
);

export default router;
