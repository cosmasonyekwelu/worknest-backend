import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxLength: [50, "Full name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    country: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    dateOfBirth: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
      minlength: 5,
      maxlength: 25,
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^https?:\/\//i.test(value),
        message: "Must be a valid URL",
      },
    },
    avatarId: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
      maxLength: [1000, "Bio cannot exceed 1000 characters"],
      default: "",
    },
    role: {
      type: String,
      enum: ["applicant", "admin"], //predefined options that must be selected
      default: "applicant",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiry: {
      type: Date,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    isCompletedOnboard: {
      type: Boolean,
      default: false,
    },

    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Jobs",
      },
    ],
    
  },
  {
    timestamps: true,
  },
);

userSchema.index({ fullname: "text", role: "text", email: "text" });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.models.User || model("User", userSchema);
export default User;
