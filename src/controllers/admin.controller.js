import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import { createAdminSendToken } from "../lib/token.js";
import adminService from "../services/admin.service.js";
import userService from "../services/user.service.js";
import authService from "../services/auth.service.js";

const { successResponse } = responseHandler;

export const adminLogin = tryCatchFn(async (req, res, next) => {
  const user = await adminService.adminLogin(req, next);
  if (!user) return;
  const { accessToken, refreshToken, cookieOptions } = createAdminSendToken(user);
  res.cookie("adminRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Admin login successful", 200);
});

export const updateAdminProfile = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const updatedUser = await userService.updateUser(userId, req.body, next);
  if (!updatedUser) return;
  return successResponse(res, updatedUser, "Profile updated successfully", 200);
});

export const adminUploadAvatar = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const user = await userService.uploadAvatar(userId, req.body.avatar, next);
  return successResponse(res, user, "Image uploaded successfully", 200);
});

export const updateAdminPassword = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const updatedUser = await userService.updateUserPassword(userId, req.body, next);
  if (!updatedUser) return;
  return successResponse(res, updatedUser, "Password updated successfully", 200);
});

export const authenticateAdmin = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const admin = await adminService.authenticateAdmin(userId, next);
  return successResponse(res, admin, "Admin authenticated", 200);
});

export const refreshAdminAccessToken = tryCatchFn(async (req, res, next) => {
  const refreshToken = req.cookies?.adminRefreshToken;
  const user = await adminService.refreshAdminAccessToken(refreshToken, next);
  if (!user) return;
  const tokenData = createAdminSendToken(user);
  if (!tokenData) return;
  const { accessToken } = tokenData;
  return successResponse(
    res,
    { accessToken },
    "Admin access token refreshed successfully",
    200
  );
});


export const getAllUsers = tryCatchFn(async (req, res, next) => {
  const { page, limit, query, role } = req.query;
  const responseData = await adminService.getAllUsers(
    parseInt(page),
    parseInt(limit),
    query,
    role,
    next
  );
  return successResponse(
    res,
    responseData,
    "Users data fetched successfully",
    200
  );
});

export const deleteAccountAdmins = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.params;
  const responseData = await adminService.deleteAccountAdmins(userId, next);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});


export const deleteProfileAccount = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const responseData = await userService.deleteAccount(userId, next);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});

export const logoutAdmin = tryCatchFn(async (req, res, next) => {
  const responseData = await authService.logout(req, res, next);
  if (!responseData) return;
  return successResponse(res, responseData, "Logged out successfully", 200);
});
