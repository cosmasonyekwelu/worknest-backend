import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import { createSendToken } from "../lib/token.js";
import authService from "../services/auth.service.js";
const { successResponse } = responseHandler;

export const register = tryCatchFn(async (req, res, next) => {
  const user = await authService.register(req, next);
  if (!user) return;
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user);
  //send the cookie
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Registration successful", 201);
});

export const login = tryCatchFn(async (req, res, next) => {
  const user = await authService.login(req, next);
  if (!user) return;
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user);
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Login successful", 200);
});

export const authenticateUser = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user; //extract user id from the request.user
  const user = await authService.authenticateUser(userId, next);
  return successResponse(res, user, "User authenticated", 200);
});

export const refreshAccessToken = tryCatchFn(async (req, res, next) => {
  //get the refreshtoken from the cookie
  const refreshToken = req.cookies?.userRefreshToken;
  const user = await authService.refreshAccessToken(refreshToken, next);
  if (!user) return;
  const tokenData = createSendToken(user);
  if (!tokenData) return;
  const { accessToken } = tokenData;
  return successResponse(
    res,
    { accessToken },
    "AccessToken refreshed succssfully",
    200
  );
});

export const verifyUserAccount = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const data = await authService.verifyUserAccount(
    { userId, ...req.body },
    next
  );
  if (!data) return;
  return successResponse(res, data, "Account verified succssfully", 200);
});

export const resendVerificationToken = tryCatchFn(async (req, res, next) => {
  const { id: userId } = req.user;
  const user = await authService.resendVerificationToken(userId, next);
  if (!user) return;
  return successResponse(
    res,
    null,
    "Verification token has been sent to your email",
    200
  );
});

export const logout = tryCatchFn(async (req, res, next) => {
  const responseData = await authService.logout(req, res, next);
  if (!responseData) return;
  return successResponse(res, responseData, "Logged out successfully", 200);
});