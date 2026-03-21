import jwt from "jsonwebtoken";
import { promisify } from "util";
import tryCatchFn from "../lib/tryCatchFn.js";
import User from "../models/user.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { getJwtSecrets } from "../config/env.js";

export const verifyAuth = tryCatchFn(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new UnauthorizedError("You are not logged in. Please log in to gain access.");
  }

  const { accessSecret } = getJwtSecrets();
  const decoded = await promisify(jwt.verify)(
    token,
    accessSecret,
  );
  if (decoded.tokenType !== "access") {
    throw new UnauthorizedError("Invalid token type for this endpoint.");
  }
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new UnauthorizedError("The user belonging to this token no longer exists.");
  }

  req.user = currentUser;
  next();
});

export const optionalAuth = tryCatchFn(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { accessSecret } = getJwtSecrets();
    const decoded = await promisify(jwt.verify)(
      token,
      accessSecret,
    );
    if (decoded.tokenType !== "access") {
      req.user = null;
      return next();
    }
    const currentUser = await User.findById(decoded.id);
    req.user = currentUser || null;
  } catch {
    req.user = null;
  }

  return next();
});

export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }

    return next();
  };
};
