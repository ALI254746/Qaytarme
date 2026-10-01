import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { connectDatabase } from "./database.js";
import { Conversation, RealtimeMessage } from "./models.js";

const shouldApply = process.argv.includes("--apply");

function getId(value: unknown) {
  if (!value) return "";
  return String(typeof value === "object" && "_id" in value ? value._id : value);
}

function getParticipantKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(":");
}

async function migrateLegacyMessages() {
  await connectDatabase();
  await Promise.all([
    Conversation.createIndexes(),
    RealtimeMessage.createIndexes(),
  ]);

  const legacyMessages = mongoose.connection.collection("messages");
  const cursor = legacyMessages.find({}).sort({ createdAt: 1 });
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  for await (const legacy of cursor) {
    scanned += 1;
    const senderId = getId(legacy.sender);
    const recipientId = getId(legacy.recipient);
    if (
      !Types.ObjectId.isValid(senderId)
      || !Types.ObjectId.isValid(recipientId)
      || senderId === recipientId
      || typeof legacy.content !== "string"
      || !legacy.content.trim()
    ) {
      skipped += 1;
      continue;
    }

    const participantIds = [senderId, recipientId].sort();
    const participantKey = getParticipantKey(senderId, recipientId);
    const senderObjectId = new Types.ObjectId(senderId);
    const recipientObjectId = new Types.ObjectId(recipientId);
    const createdAt = legacy.createdAt instanceof Date
      ? legacy.createdAt
      : legacy._id instanceof Types.ObjectId
        ? legacy._id.getTimestamp()
        : new Date(0);
    const itemId = Types.ObjectId.isValid(getId(legacy.item))
      ? new Types.ObjectId(getId(legacy.item))
      : undefined;

    if (!shouldApply) {
      migrated += 1;
      continue;
    }

    const conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participantIds: participantIds.map((id) => new Types.ObjectId(id)),
          participantKey,
          startedBy: senderObjectId,
          status: "active",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await Conversation.updateOne(
      {
        _id: conversation._id,
        $or: [
          { lastMessageAt: { $lte: createdAt } },
          { lastMessageAt: null },
        ],
      },
      {
        $set: {
          lastMessageAt: createdAt,
          lastMessagePreview: legacy.content.trim().slice(0, 160),
          ...(itemId ? { itemId } : {}),
        },
      },
    );

    const readBy = [{ userId: senderObjectId, readAt: createdAt }];
    if (legacy.read) readBy.push({ userId: recipientObjectId, readAt: createdAt });
    const legacyMessageId = String(legacy._id);
    await RealtimeMessage.updateOne(
      { legacyMessageId },
      {
        $setOnInsert: {
          conversationId: conversation._id,
          senderId: senderObjectId,
          body: legacy.content.trim().slice(0, 3000),
          clientMessageId: `legacy-${legacyMessageId}`,
          legacyMessageId,
          readBy,
          createdAt,
          updatedAt: legacy.updatedAt instanceof Date ? legacy.updatedAt : createdAt,
        },
      },
      { upsert: true },
    );
    migrated += 1;
  }

  console.log(
    `${shouldApply ? "Migratsiya bajarildi" : "Sinov rejimi"}: ${migrated}/${scanned} xabar ko‘rib chiqildi, ${skipped} noto‘g‘ri yozuv o‘tkazib yuborildi.`,
  );
  if (!shouldApply) {
    console.log("Ma’lumotlar o‘zgartirilmadi. Saqlash uchun --apply argumentini bering.");
  }
}

migrateLegacyMessages()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error("Eski xabarlarni ko‘chirishda xatolik:", error);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
