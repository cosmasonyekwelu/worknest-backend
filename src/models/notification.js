import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
      required: true,
      maxLength: 100,
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    relatedData: {
      jobId: { type: Schema.Types.ObjectId, ref: "Job" },
      applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    actionUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  model("Notification", notificationSchema);
