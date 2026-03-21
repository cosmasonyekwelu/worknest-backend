import User from "../models/user.js";
import mailService from "./email.service.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
import logger from "../config/logger.js";
import { AppError, NotFoundError, ValidationError, ConflictError } from "../lib/errors.js";

const userService = {
  forgotPassword: async (req) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    // generate password reset token
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashedResetCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");
    const resetCodeExpiry = new Date(Date.now() + 900000); //15minutes
    user.passwordResetToken = hashedResetCode;
    user.passwordResetTokenExpiry = resetCodeExpiry;
    await user.save();
    process.nextTick(() => {
      mailService.sendPasswordResetEmail(user, resetCode).catch(async (error) => {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiry = undefined;
        await user.save();
        logger.error("Failed to send password token", {
          error: error.message,
          userId: user._id?.toString(),
        });
      });
    });
    return user;
  },
  resetPassword: async (userData) => {
    const { email, password, confirmPassword, passwordResetToken } = userData;
    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }
    const user = await User.findOne({ email }).select(
      "+password +passwordResetToken +passwordResetTokenExpiry",
    );
    if (!user) {
      throw new NotFoundError("Account not found with that email");
    }
    const hashedIncomingToken = crypto
      .createHash("sha256")
      .update(passwordResetToken)
      .digest("hex");

    if (
      !user.passwordResetToken ||
      user.passwordResetToken !== hashedIncomingToken
    ) {
      throw new ValidationError("Password reset token not found");
    }
    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (isPasswordSame) {
      throw new ValidationError("New password must be different from old password");
    }
    if (user.passwordResetTokenExpiry < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save();
      throw new ValidationError("Password reset token has expired");
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();
    await User.findByIdAndUpdate(user._id, {
      refreshTokenHash: undefined,
      refreshTokenExpiresAt: undefined,
      $inc: { tokenVersion: 1 },
    });
    return user;
  },
  uploadAvatar: async (userId, avatar) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("No user found with that ID");
    }
    if (!avatar) {
      throw new ValidationError("No file uploaded");
    }
    //check if user has avatar already
    const currentAvatar = user.avatar;
    const currentAvatarId = user.avatarId;
    if (currentAvatar) {
      //if avatar exists, delete and replace with new avatar
      await deleteFromCloudinary(currentAvatarId);
    }
    const { url, public_id } = await uploadToCloudinary(avatar, {
      folder: "Worknest/avatars",
      width: 200,
      height: 200,
      crop: "fit",
      format: "webp",
    });
    user.avatar = url || user.avatar;
    user.avatarId = public_id || user.avatarId;
    await user.save();
    return user;
  },
  updateUserPassword: async (userId, userData) => {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new NotFoundError("No user found with that ID");
    }
    const { password, newPassword, confirmPassword } = userData;
    const [checkPassword, isPasswordSame] = await Promise.all([
      bcrypt.compare(password, user.password),
      bcrypt.compare(newPassword, user.password),
    ]);
    if (!checkPassword) {
      throw new ValidationError("Incorrect current password");
    }
    if (newPassword !== confirmPassword) {
      throw new ValidationError("New password and confirm password does not match");
    }
    if (isPasswordSame) {
      throw new ValidationError("New password must be different from old password");
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    const updatedUser = await user.save();
    await User.findByIdAndUpdate(userId, {
      refreshTokenHash: undefined,
      refreshTokenExpiresAt: undefined,
      $inc: { tokenVersion: 1 },
    });
    return updatedUser;
  },
  // update user
  updateUser: async (userId, userData) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("No user found with that ID");
    }

    // Email uniqueness check
    if (userData.email) {
      const emailExists = await User.findOne({
        email: userData.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (emailExists) {
        throw new ConflictError("User with email already exists");
      }
      user.email = userData.email.toLowerCase().trim();
    }

    // Phone uniqueness check
    if (userData.phone) {
      const phoneExists = await User.findOne({
        phone: userData.phone,
        _id: { $ne: userId },
      });
      if (phoneExists) {
        throw new ConflictError("User with phone already exists");
      }
      user.phone = userData.phone.trim();
    }

    // Allowed profile updates
    const allowedUpdates = ["fullname", "dateOfBirth", "bio", "country"];

    for (const key of allowedUpdates) {
      if (userData[key] !== undefined && userData[key] !== null) {
        user[key] = userData[key];
      }
    }
    const updatedUser = await user.save();
    return updatedUser;
  },
  // delete user account
  deleteAccount: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    if (user.avatarId) {
      await deleteFromCloudinary(user.avatarId);
    }
    await User.findByIdAndUpdate(userId, {
      refreshTokenHash: undefined,
      refreshTokenExpiresAt: undefined,
      $inc: { tokenVersion: 1 },
    });
    await User.findByIdAndDelete(userId);
    return true;
  },
};
export default userService;
