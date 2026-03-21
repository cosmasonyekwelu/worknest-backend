import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { deleteFromCloudinary } from "../lib/cloudinary.js";
import { getJwtSecrets } from "../config/env.js";
import { NotFoundError, UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import {
  hashToken as hashRefreshToken,
  persistRefreshTokenState,
  invalidateRefreshTokenState,
} from "../lib/session.js";

const adminService = {
  // admin login service - only admins can login
  adminLogin: async (req) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password +tokenVersion",
    );

    if (!user) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    // Check if user role is admin
    if (user.role !== "admin") {
      throw new ForbiddenError("Only admins can access this route.");
    }

    // Handle password comparison
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    return user;
  },

  issueAndPersistRefreshToken: async (userId, refreshToken) => {
    await persistRefreshTokenState(userId, refreshToken);
  },

  // authenticate admin - verify admin status
  authenticateAdmin: async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("Admin not found");
    }

    // Verify user is still an admin
    if (user.role !== "admin") {
      throw new ForbiddenError("Your admin privileges have been revoked");
    }

    return user;
  },

  // refresh admin access token
  refreshAdminAccessToken: async (refreshToken) => {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    // Verify the refresh token
    const { refreshSecret } = getJwtSecrets();
    const decoded = jwt.verify(
      refreshToken,
      refreshSecret,
    );

    if (decoded.tokenType !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const user = await User.findById(decoded.id).select(
      "+refreshTokenHash +refreshTokenExpiresAt +tokenVersion",
    );

    if (!user) {
      throw new NotFoundError("Admin account not found");
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

    // Verify user is still an admin
    if (user.role !== "admin") {
      throw new ForbiddenError("Your admin privileges have been revoked");
    }

    return user;
  },

  getAllUsers: async (page = 1, limit = 3, query = "", role = "") => {
    const sanitizeQuery =
      query || role
        ? (query || role).toLowerCase().replace(/[^\w\s]/gi, "")
        : "";
    const [users, total] = sanitizeQuery
      ? await Promise.all([
          User.find({
            $or: [
              { fullname: { $regex: sanitizeQuery, $options: "i" } },
              { role: { $regex: sanitizeQuery, $options: "i" } },
            ],
          })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
          User.countDocuments({
            $or: [
              { fullname: { $regex: sanitizeQuery, $options: "i" } },
              { role: { $regex: sanitizeQuery, $options: "i" } },
            ],
          }),
        ])
      : await Promise.all([
          User.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
          User.countDocuments(),
        ]);

    return {
      meta: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasMore: (page - 1) * limit + users.length < total,
        limit,
      },
      users,
    };
  },

  logoutAdmin: async (res, userId) => {
    if (userId) {
      await invalidateRefreshTokenState(userId, true);
    }

    res.cookie("adminRefreshToken", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/api/v1/admin/refresh-token",
    });
    return true;
  },
  deleteAccountAdmins: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    if (user.avatarId) {
      await deleteFromCloudinary(user.avatarId);
    }
    await user.deleteOne();
    return true;
  },
};

export default adminService;
