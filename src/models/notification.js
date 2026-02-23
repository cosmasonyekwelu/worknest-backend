import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "application_received",
        "application_status",
        "job_posted",
        "profile_viewed",
        "message",
        "job_alert",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxLength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxLength: [500, "Message cannot exceed 500 characters"],
    },
    relatedData: {
      type: {
        jobId: Schema.Types.ObjectId,
        applicationId: Schema.Types.ObjectId,
        userId: Schema.Types.ObjectId,
      },
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    actionUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

const Notification =
  mongoose.models.Notification || model("Notification", notificationSchema);

export default Notification;
