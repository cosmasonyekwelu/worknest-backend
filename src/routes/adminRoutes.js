import express from "express";
import {
  adminLogin,
  authenticateAdmin,
  deleteAccountAdmins,
  getAllUsers,
  refreshAdminAccessToken,
  updateAdminProfile,
  updateAdminPassword,
  adminUploadAvatar,
  deleteProfileAccount,
  logoutAdmin,
} from "../controllers/admin.controller.js";
import { rateLimiter, refreshTokenLimit } from "../middleware/rateLimit.js";
import { validateFormData } from "../middleware/validateForm.js";
import {
  validateSignInSchema,
  updatePasswordSchema,
  validateAdminProfile,
} from "../lib/dataSchema.js";
import { verifyAuth, authorizedRoles } from "../middleware/authenticate.js";
import { cacheMiddleware, clearCache } from "../middleware/cache.js";
import uploadImage from "../middleware/uploadImage.js";

const router = express.Router();

// Admin login route - restricted to admin accounts only
router.post(
  "/login",
  rateLimiter,
  validateFormData(validateSignInSchema),
  adminLogin,
);

// Get authenticated admin details
router.get(
  "/profile",
  verifyAuth,
  authorizedRoles("admin"),
  cacheMiddleware("admin_profile", 3600),
  authenticateAdmin,
);

router.post("/refresh-token", refreshTokenLimit, refreshAdminAccessToken);


// Update admin profile (reuses userService.updateUser)
router.patch(
  "/profile",
  verifyAuth,
  authorizedRoles("admin"),
  validateFormData(validateAdminProfile),
  updateAdminProfile,
);
router.patch(
  "/upload-avatar",
  verifyAuth,
  authorizedRoles("admin"),
    uploadImage.single("avatar"),
  clearCache("admin_profile"),
  adminUploadAvatar,
);

// Update admin password (reuses userService.updateUserPassword)
router.patch(
  "/profile/password",
  verifyAuth,
  authorizedRoles("admin"),
  validateFormData(updatePasswordSchema),
  updateAdminPassword,
);


router.delete(
  "/:id/delete-account",
  verifyAuth,
  authorizedRoles("admin"),
  clearCache("users"),
  deleteAccountAdmins,
);

router.delete(
  "/delete-account",
  verifyAuth,
  authorizedRoles("admin"),
  clearCache("admin_profile"),
  deleteProfileAccount,
);

router.get(
  "/all",
  verifyAuth,
  authorizedRoles("admin"),
  cacheMiddleware("users", 3600),
  getAllUsers,
);

router.post("/logout", verifyAuth, clearCache("admin_profile"), logoutAdmin);

export default router;
