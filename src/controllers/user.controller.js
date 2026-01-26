import userService from "../services/user.service.js";
import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";

const { successResponse } = responseHandler;

export const forgotPassword = tryCatchFn(async (req, res, next) => {
  const user = await userService.forgotPassword(req, next);
  if (!user) return;
  return successResponse(
    res,
    null,
    "Password reset link has been sent to your email",
    200
  );
});

export const resetPassword = tryCatchFn(async (req, res, next) => {
  const email = req.query.email || "";
  const passwordResetToken = req.query.token || "";
  const responseData = await userService.resetPassword(
    { ...req.body, email, passwordResetToken },
    next
  );
  if (!responseData) return;
  return successResponse(res, null, "Password reset successfully", 200);
});

export const logout = tryCatchFn(async (req, res, next) => {
  const responseData = await userService.logout(req, res, next);
  if (!responseData) return;
  return successResponse(res, responseData, "Logged out successfully", 200);
});

export const updateUserPassword = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const responseData = await userService.updateUserPassword(
    userId,
    req.body,
    next
  );
  return successResponse(
    res,
    responseData,
    "User password updated successfully",
    200
  );
});

export const updateUser = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const responseData = await userService.updateUser(userId, req.body, next);
  if (!responseData) return;
  return successResponse(
    res,
    responseData,
    "Profile updated successfully",
    200
  );
});

export const deleteAccount = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const responseData = await userService.deleteAccount(userId, next);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});

export const getAllUsers = tryCatchFn(async (req, res, next) => {
  const { page, limit, query, role } = req.query;
  const responseData = await userService.getAllUsers(
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
  const responseData = await userService.deleteAccountAdmins(userId, next);
  return successResponse(
    res,
    responseData,
    "User account deleted successfully",
    200
  );
});