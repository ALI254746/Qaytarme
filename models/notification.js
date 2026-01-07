import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  avatar: { type: String, default: "" },
  // Avatar for the user who triggered the notification
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
