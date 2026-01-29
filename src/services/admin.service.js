import User from "../models/user.js";
import responseHandler from "../lib/responseHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../lib/cloudinary.js";

const { errorResponse, notFoundResponse } = responseHandler;

const adminService = {
  // admin login service - only admins can login
  adminLogin: async (req, next) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    
    if (!user) {
      return next(errorResponse("Admin account not found", 401));
    }

    // Check if user role is admin
    if (user.role !== "admin") {
      return next(
        errorResponse(
          "Only admins can access this route. Please contact an administrator to upgrade your account.",
          403
        )
      );
    }

    // Handle password comparison
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    
    if (!isPasswordValid) {
      return next(errorResponse("Incorrect email or password", 401));
    }

    return user;
  },

  // authenticate admin - verify admin status
  authenticateAdmin: async (userId, next) => {
    const user = await User.findById(userId);
    
    if (!user) {
      return next(notFoundResponse("Admin not found"));
    }

    // Verify user is still an admin
    if (user.role !== "admin") {
      return next(
        errorResponse("Your admin privileges have been revoked", 403)
      );
    }

    return user;
  },

  // refresh admin access token
  refreshAdminAccessToken: async (refreshToken, next) => {
    if (!refreshToken) {
      return next(errorResponse("Refresh token is required", 401));
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    
    if (!decoded) {
      return next(errorResponse("Invalid refresh token", 401));
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(notFoundResponse("Admin account not found"));
    }

    // Verify user is still an admin
    if (user.role !== "admin") {
      return next(
        errorResponse("Your admin privileges have been revoked", 403)
      );
    }

    return user;
  },
//   don't think we might need it but i will leave it here for now
   getAllUsers: async (page = 1, limit = 3, query = "", role = "", next) => {
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
    if (!users) {
      return next(notFoundResponse("No users found"));
    }
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
    deleteAccountAdmins: async (userId, next) => {
    const user = await User.findById(userId);
    if (!user) {
      return next(notFoundResponse("Account not found"));
    }
    if (user.avatarId) {
      await deleteFromCloudinary(user.avatarId);
    }
    await user.deleteOne();
    return true;
  },
};

export default adminService;
