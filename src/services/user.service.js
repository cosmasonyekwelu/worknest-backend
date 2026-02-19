import User from "../models/user.js";
import mailService from "./email.service.js";
import responseHandler from "../lib/responseHandler.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
const { errorResponse, notFoundResponse } = responseHandler;

const userService = {
  forgotPassword: async (req, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(errorResponse("Account not found", 404));
    }
    // generate password reset token
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpiry = new Date(Date.now() + 900000); //15minutes
    user.passwordResetToken = resetCode;
    user.passwordResetTokenExpiry = resetCodeExpiry;
    await user.save();
    process.nextTick(() => {
      mailService.sendPasswordResetEmail(user).catch(async (error) => {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiry = undefined;
        await user.save();
        console.error("Failed to send password token", error);
      });
    });
    return user;
  },
  resetPassword: async (userData, next) => {
    const { email, password, confirmPassword, passwordResetToken } = userData;
    if (password !== confirmPassword) {
      return next(errorResponse("Passwords do not match", 400));
    }
    const user = await User.findOne({ email }).select(
      "+password +passwordResetToken +passwordResetTokenExpiry",
    );
    if (!user) {
      return next(notFoundResponse("Account not found with that email"));
    }
    if (
      !user.passwordResetToken ||
      user.passwordResetToken !== passwordResetToken
    ) {
      return next(errorResponse("Password reset token not found", 400));
    }
    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (isPasswordSame) {
      return next(
        errorResponse("New password must be different from old password", 400),
      );
    }
    if (user.passwordResetTokenExpiry < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save();
      return next(errorResponse("Password reset token has expired", 400));
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();
    return user;
  },
  uploadAvatar: async (userId, avatar, next) => {
    const user = await User.findById(userId);
    if (!user) {
      return next(notFoundResponse("No user found with that email"));
    }
    if (!avatar) {
      return next(errorResponse("No file uploaded", 400));
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
  updateUserPassword: async (userId, userData, next) => {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(notFoundResponse("No user found with that email"));
    }
    const { password, newPassword, confirmPassword } = userData;
    const [checkPassword, isPasswordSame] = await Promise.all([
      bcrypt.compare(password, user.password),
      bcrypt.compare(newPassword, user.password),
    ]);
    if (!checkPassword) {
      return next(errorResponse("Incorrect current password", 400));
    }
    if (newPassword !== confirmPassword) {
      return next(
        errorResponse("New password and confirm password does not match", 400),
      );
    }
    if (isPasswordSame) {
      return next(
        errorResponse("New password must be different from old password", 400),
      );
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    const updatedUser = await user.save();
    return updatedUser;
  },
  // update user
  updateUser: async (userId, userData, next) => {
    const user = await User.findById(userId);
    if (!user) {
      return next(notFoundResponse("No user found with that id"));
    }

    // Email uniqueness check
    if (userData.email) {
      const emailExists = await User.findOne({
        email: userData.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (emailExists) {
        return next(errorResponse("User with email already exists", 400));
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
        return next(errorResponse("User with phone already exists", 400));
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
  deleteAccount: async (userId, next) => {
    const user = await User.findById(userId);
    if (!user) {
      return next(notFoundResponse("Account not found"));
    }
    if (user.avatarId) {
      await deleteFromCloudinary(user.avatarId);
    }
    await User.findByIdAndDelete(userId);
    return true;
  },
};
export default userService;
