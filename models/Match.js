
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ariza",
      required: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ariza",
      required: true,
    },
    similarity: {
      type: Number, // Qo'shimcha aniqlik foizi, masalan 0-100
      default: 0,
    },
    reason: {
      type: String, // Nima uchun mos keldi (masalan: "Nomi va kategoriyasi mos")
    },
    status: {
      type: String,
      enum: ["new", "viewed", "contacted", "confirmed", "rejected"],
      default: "new", // Foydalanuvchi ko'rdimi yo'qmi
    },
    user1: { // Lost Item owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: { // Found Item owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  { timestamps: true }
);

// Bitta juftlik faqat bir marta saqlansin
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
