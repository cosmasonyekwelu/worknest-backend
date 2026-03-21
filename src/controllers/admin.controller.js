import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import { createAdminSendToken } from "../lib/token.js";
import adminService from "../services/admin.service.js";
import userService from "../services/user.service.js";

const { successResponse } = responseHandler;

export const adminLogin = tryCatchFn(async (req, res) => {
  const user = await adminService.adminLogin(req);
  const { accessToken, refreshToken, cookieOptions } = createAdminSendToken(user, user.tokenVersion || 0);
  await adminService.issueAndPersistRefreshToken(user._id, refreshToken);
  res.cookie("adminRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Admin login successful", 200);
});

export const updateAdminProfile = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const updatedUser = await userService.updateUser(userId, req.body);
  return successResponse(res, updatedUser, "Profile updated successfully", 200);
});

export const adminUploadAvatar = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  let avatarPayload = null;
  if (req.file) {
    const file = req.file;
    avatarPayload = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  } else if (req.body && req.body.avatar) {
    avatarPayload = req.body.avatar;
  }

  const user = await userService.uploadAvatar(userId, avatarPayload);
  return successResponse(res, user, "Image uploaded successfully", 200);
});

export const updateAdminPassword = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const updatedUser = await userService.updateUserPassword(userId, req.body);
  return successResponse(res, updatedUser, "Password updated successfully", 200);
});

export const authenticateAdmin = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const admin = await adminService.authenticateAdmin(userId);
  return successResponse(res, admin, "Admin authenticated", 200);
});

export const refreshAdminAccessToken = tryCatchFn(async (req, res) => {
  const incomingRefreshToken = req.cookies?.adminRefreshToken;
  const user = await adminService.refreshAdminAccessToken(incomingRefreshToken);
  const { accessToken, refreshToken: rotatedRefreshToken, cookieOptions } = createAdminSendToken(user, user.tokenVersion || 0);
  await adminService.issueAndPersistRefreshToken(user._id, rotatedRefreshToken);
  res.cookie("adminRefreshToken", rotatedRefreshToken, cookieOptions);
  return successResponse(
    res,
    { accessToken },
    "Admin access token refreshed successfully",
    200
  );
});


export const getAllUsers = tryCatchFn(async (req, res) => {
  const { page, limit, query, role } = req.query;
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;

  const responseData = await adminService.getAllUsers(
    safePage,
    safeLimit,
    query,
    role
  );
  return successResponse(
    res,
    responseData,
    "Users data fetched successfully",
    200
  );
});

export const deleteAccountAdmins = tryCatchFn(async (req, res) => {
  const { id: userId } = req.params;
  const responseData = await adminService.deleteAccountAdmins(userId);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});


export const deleteProfileAccount = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const responseData = await userService.deleteAccount(userId);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});

export const logoutAdmin = tryCatchFn(async (req, res) => {
  const responseData = await adminService.logoutAdmin(res, req.user._id);
  return successResponse(res, responseData, "Logged out successfully", 200);
});
