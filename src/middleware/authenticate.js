import jwt from "jsonwebtoken";
import { promisify } from "util";
import tryCatchFn from "../lib/tryCatchFn.js";
import responseHandler from "../lib/responseHandler.js";
import User from "../models/user.js";

const { forbiddenResponse, unauthorizedResponse } = responseHandler;

export const verifyAuth = tryCatchFn(async (req, res, next) => {
  //check if token exists
  let token;
  //checking for our token in the request headers object and ensuring it starts with the Bearer signature word ensuring its jwt type token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; //extracts the token without Bearer
  }
  if (!token) {
    return next(
      unauthorizedResponse(
        "You are not logged in!, Please log in to gain access.",
      ),
    );
  }
  //verify the token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY,
  );
  //check if a user exists with our decoded id
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      unauthorizedResponse(
        "The user belonging to this token no longer exists.",
      ),
    );
  }
  //assign user to our request object
  req.user = currentUser;
  next(); //pass to the next event
});

//optional auth - tries to authenticate but doesn't fail if no token
export const optionalAuth = tryCatchFn(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_KEY,
      );
      const currentUser = await User.findById(decoded.id);
      if (currentUser) {
        req.user = currentUser;
      }
    } catch (err) {
      // Token is invalid or expired, but we don't fail - just continue without auth
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

//role based auth
export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        forbiddenResponse("You do not have permission to perform this action"),
      );
    }
    next();
  };
};
