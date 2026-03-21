import User from "../models/user.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mailService from "./email.service.js";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import { getJwtSecrets } from "../config/env.js";
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from "../lib/errors.js";
import {
  hashToken as hashRefreshToken,
  persistRefreshTokenState,
  invalidateRefreshTokenState,
} from "../lib/session.js";

const authService = {
  // registration service
  register: async (req) => {
    // checking if email already exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      throw new ConflictError("Email already exists");
    }
    // sending verification code if email does not exist
    const verificationCode = crypto.randomInt(100000, 999999).toString(); //6 characters
    const verificationCodeExpiry = new Date(Date.now() + 3600000); //1hr expiry
    //handling password encryption
    const salt = await bcrypt.genSalt(12); //increased salt rounds for security
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    //proceed to creating our user
    const user = await User.create({
      email: req.body.email,
      fullname: req.body.fullname,
      role: "applicant",
      password: hashedPassword,
      verificationToken: verificationCode,
      verificationTokenExpiry: verificationCodeExpiry,
    });

    if (!user) {
      throw new AppError("User registration failed", 500);
    }

    //proceed to sending email to user
    // preventing email service from blocking user creation
    process.nextTick(() => {
      mailService.sendWelcomeMail(user).catch((error) => {
        logger.error("Failed to send welcome email", {
          error: error.message,
          userId: user._id?.toString(),
        });
      }); //catch email sending error
    });

    return user;
  },

  // login service
  login: async (req) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password +tokenVersion",
    );
    if (!user) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    // Check if user is an admin - admins must use the admin login route
    if (user.role === "admin") {
      throw new AppError("Use Admin Route.", 403);
    }

    // handle password comparison
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Incorrect email or password");
    }
    return user;
  },

  authenticateUser: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  },

  issueAndPersistRefreshToken: async (userId, refreshToken) => {
    await persistRefreshTokenState(userId, refreshToken);
  },

  refreshAccessToken: async (refreshToken) => {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const { refreshSecret } = getJwtSecrets();
    const decoded = jwt.verify(refreshToken, refreshSecret);

    if (decoded.tokenType !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const user = await User.findById(decoded.id).select(
      "+refreshTokenHash +refreshTokenExpiresAt +tokenVersion",
    );
    if (!user) {
      throw new NotFoundError("User account not found");
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedError("Refresh token is no longer valid");
    }

    if (!user.refreshTokenHash || hashRefreshToken(refreshToken) !== user.refreshTokenHash) {
      // Potential reuse detected: token has correct version but wrong hash.
      // Invalidate all sessions for this user as a precaution.
      await invalidateRefreshTokenState(user._id, true);
      throw new UnauthorizedError("Refresh token reuse detected. Please log in again.");
    }

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      await invalidateRefreshTokenState(user._id, true);
      throw new UnauthorizedError("Refresh token has expired");
    }

    return user;
  },

  verifyUserAccount: async (data) => {
    const { userId, verificationToken } = data;
    const user = await User.findById(userId).select(
      "+verificationToken +verificationTokenExpiry",
    );
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    //check if user is already verified
    if (user.isVerified) {
      throw new AppError("Account is already verified", 400);
    }
    //check if verificationToken saved in db is same as the one received from the form
    if (user.verificationToken !== verificationToken) {
      throw new AppError("Invalid verification token", 400);
    }
    //check for token expiry
    if (user.verificationTokenExpiry < new Date()) {
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();
      throw new AppError("Verification token has expired, please get a new one", 400);
    }
    //verify user if token has not expired
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    return user;
  },

  resendVerificationToken: async (userId) => {
    const user = await User.findById(userId).select(
      "+verificationToken +verificationTokenExpiry",
    );
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    if (user.isVerified) {
      throw new AppError("Account already verified", 400);
    }
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = new Date(Date.now() + 3600000); //1 hr
    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = verificationCodeExpiry;
    await user.save();
    process.nextTick(() => {
      mailService.sendVerificationCode(user).catch(async (error) => {
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();
        logger.error("Failed to send verification token", {
          error: error.message,
          userId: user._id?.toString(),
        });
      });
    });
    return user;
  },

  logout: async (res, userId) => {
    if (userId) {
      await invalidateRefreshTokenState(userId, true);
    }

    res.cookie("userRefreshToken", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/api/v1/auth/refresh-token",
    });
    return true;
  },
};

export default authService;
