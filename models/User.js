// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    points: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    bio: {
      type: String, // foydalanuvchi o‘zining bio sini yozadi
      default: "",
    },
    // ✅ Do‘stlar ro‘yxati
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
      },
    ],

    notifications: [
      {
        type: {
          type: String,
          enum: ["friend_request", "like", "comment", "new-ariza", "system"],
          required: true,
        },
        message: { type: String, required: true },
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],

    // Parolni tiklash uchun
    resetCode: { type: String, default: null },
    resetCodeExpiry: { type: Date, default: null },

    // Emaili verifikatsiya qilish uchun
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
