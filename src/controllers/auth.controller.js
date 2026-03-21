import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import { createSendToken } from "../lib/token.js";
import authService from "../services/auth.service.js";

const { successResponse } = responseHandler;

export const register = tryCatchFn(async (req, res) => {
  const user = await authService.register(req);
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user, user.tokenVersion || 0);
  await authService.issueAndPersistRefreshToken(user._id, refreshToken);
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Registration successful", 201);
});

export const login = tryCatchFn(async (req, res) => {
  const user = await authService.login(req);
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user, user.tokenVersion || 0);
  await authService.issueAndPersistRefreshToken(user._id, refreshToken);
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Login successful", 200);
});

export const authenticateUser = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const user = await authService.authenticateUser(userId);
  return successResponse(res, user, "User authenticated", 200);
});

export const refreshAccessToken = tryCatchFn(async (req, res) => {
  const incomingRefreshToken = req.cookies?.userRefreshToken;
  const user = await authService.refreshAccessToken(incomingRefreshToken);
  const { accessToken, refreshToken: rotatedRefreshToken, cookieOptions } = createSendToken(user, user.tokenVersion || 0);
  await authService.issueAndPersistRefreshToken(user._id, rotatedRefreshToken);
  res.cookie("userRefreshToken", rotatedRefreshToken, cookieOptions);
  return successResponse(
    res,
    { accessToken },
    "AccessToken refreshed successfully",
    200,
  );
});

export const verifyUserAccount = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  const user = await authService.verifyUserAccount({ userId, ...req.body });
  return successResponse(res, user, "Account verified successfully", 200);
});

export const resendVerificationToken = tryCatchFn(async (req, res) => {
  const { id: userId } = req.user;
  await authService.resendVerificationToken(userId);
  return successResponse(
    res,
    null,
    "Verification token has been sent to your email",
    200,
  );
});

export const logout = tryCatchFn(async (req, res) => {
  const responseData = await authService.logout(res, req.user._id);
  return successResponse(res, responseData, "Logged out successfully", 200);
});
