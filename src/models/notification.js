import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "application_submitted",      // applicant confirmation
        "application_status_changed", // status update
        "new_application_admin",      // admin alert
        "job_expiring",               // optional future use
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed, // can hold jobId, applicationId, etc.
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

// Index for sorting by newest
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.models.Notification || model("Notification", notificationSchema);

export default Notification;