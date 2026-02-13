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

export const uploadAvatar = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  let avatarPayload = null;
  if (req.file) {
    const file = req.file;
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    avatarPayload = dataUri;
  } else if (req.body && req.body.avatar) {
    avatarPayload = req.body.avatar;
  }

  const user = await userService.uploadAvatar(userId, avatarPayload, next);
  return successResponse(res, user, "Image uploaded successfully", 200);
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
