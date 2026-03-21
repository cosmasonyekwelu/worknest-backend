import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { AppError } from "./errors.js";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const persistRefreshTokenState = async (userId, refreshToken) => {
  const decoded = jwt.decode(refreshToken);
  if (!decoded?.exp) {
    throw new AppError("Unable to issue refresh session", 500);
  }

  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(decoded.exp * 1000),
  });
};

export const invalidateRefreshTokenState = async (userId, incrementVersion = false) => {
  const update = {
    refreshTokenHash: undefined,
    refreshTokenExpiresAt: undefined,
  };
  if (incrementVersion) {
    update.$inc = { tokenVersion: 1 };
  }

  await User.findByIdAndUpdate(userId, update);
};
