import {configureRedisAdapter} from './redis-adapter.js';
import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Types } from "mongoose";
import { verifySocketToken } from "./auth.js";
import { connectDatabase } from "./database.js";
import { ChatUser, Conversation, RealtimeMessage } from "./models.js";
import type {
  ChatMessageDto,
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types.js";

type SocketData = { userId: string; role: "user" | "admin" };
const port = Number(process.env.SOCKET_SERVER_PORT ?? 4001);
const allowedOrigin = process.env.SOCKET_ALLOWED_ORIGIN ?? "http://localhost:3000";
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SOCKET_SERVER_PORT noto‘g‘ri");
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(
  httpServer,
  {
    cors: {
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  },
);

function roomName(conversationId: string) {
  return `conversation:${conversationId}`;
}

function serializeMessage(message: {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  clientMessageId: string;
  createdAt: Date;
  readBy: Array<{ userId: Types.ObjectId; readAt: Date }>;
}): ChatMessageDto {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    body: message.body,
    clientMessageId: message.clientMessageId,
    createdAt: message.createdAt.toISOString(),
    readBy: (message.readBy ?? []).map((entry) => ({
      userId: String(entry.userId),
      readAt: entry.readAt.toISOString(),
    })),
  };
}

async function getAuthorizedConversation(conversationId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversationId)) return null;
  return Conversation.findOne({
    _id: conversationId,
    participantIds: new Types.ObjectId(userId),
  });
}

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") return next(new Error("Unauthorized"));
    const principal = await verifySocketToken(token);
    socket.data.userId = principal.userId;
    socket.data.role = principal.role;
    next();
  } catch (error) {
    console.warn("Socket autentifikatsiyasi rad etildi:", error);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  let messageWindowStartedAt = Date.now();
  let messagesInWindow = 0;
  void socket.join(`user:${userId}`);

  socket.on("conversation:join", async (payload, callback) => {
    if (
      !payload
      || typeof payload.conversationId !== "string"
      || typeof callback !== "function"
    ) return;
    try {
      const { conversationId } = payload;
      const conversation = await getAuthorizedConversation(conversationId, userId);
      if (!conversation) {
        callback({ ok: false, error: "Suhbatga ruxsat mavjud emas" });
        return;
      }
      await socket.join(roomName(conversationId));
      callback({ ok: true });
    } catch (error) {
      console.error("Suhbat xonasiga qo‘shilmadi:", error);
      callback({ ok: false, error: "Suhbatga ulanib bo‘lmadi" });
    }
  });

  socket.on("conversation:leave", (payload) => {
    if (typeof payload?.conversationId === "string") {
      void socket.leave(roomName(payload.conversationId));
    }
  });

  socket.on("typing:start", async (payload) => {
    if (typeof payload?.conversationId !== "string") return;
    const { conversationId } = payload;
    try {
      const conversation = await getAuthorizedConversation(conversationId, userId);
      if (!conversation || conversation.status !== "active") return;
      socket.to(roomName(conversationId)).emit("typing:changed", {
        conversationId,
        userId,
        typing: true,
      });
    } catch (error) {
      console.error("Typing holati yuborilmadi:", error);
    }
  });

  socket.on("typing:stop", async (payload) => {
    if (typeof payload?.conversationId !== "string") return;
    const { conversationId } = payload;
    try {
      const conversation = await getAuthorizedConversation(conversationId, userId);
      if (!conversation) return;
      socket.to(roomName(conversationId)).emit("typing:changed", {
        conversationId,
        userId,
        typing: false,
      });
    } catch (error) {
      console.error("Typing holati yuborilmadi:", error);
    }
  });

  socket.on("message:send", async (payload, callback) => {
    if (typeof callback !== "function") return;
    try {
      const conversationId = payload?.conversationId;
      const body = typeof payload?.body === "string" ? payload.body.trim() : "";
      const clientMessageId = payload?.clientMessageId;
      if (!body || body.length > 3000) {
        callback({ ok: false, error: "Xabar 1–3000 belgi bo‘lishi kerak" });
        return;
      }
      if (
        !Types.ObjectId.isValid(conversationId)
        || typeof clientMessageId !== "string"
        || !clientMessageId.trim()
        || clientMessageId.length > 100
      ) {
        callback({ ok: false, error: "Xabar ma’lumoti noto‘g‘ri" });
        return;
      }
      const now = Date.now();
      if (now - messageWindowStartedAt >= 60_000) {
        messageWindowStartedAt = now;
        messagesInWindow = 0;
      }
      if (messagesInWindow >= 30) {
        callback({ ok: false, error: "Bir daqiqada 30 tadan ko‘p xabar yuborib bo‘lmaydi" });
        return;
      }
      messagesInWindow += 1;

      const conversation = await getAuthorizedConversation(conversationId, userId);
      if (!conversation || conversation.status !== "active") {
        callback({ ok: false, error: "Suhbat yopilgan yoki ruxsat mavjud emas" });
        return;
      }

      const senderId = new Types.ObjectId(userId);
      const message = await RealtimeMessage.findOneAndUpdate(
        { conversationId: conversation._id, senderId, clientMessageId },
        {
          $setOnInsert: {
            conversationId: conversation._id,
            senderId,
            body,
            clientMessageId,
            readBy: [{ userId: senderId, readAt: new Date() }],
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (!conversation.lastMessageAt || message.createdAt >= conversation.lastMessageAt) {
        conversation.lastMessageAt = message.createdAt;
        conversation.lastMessagePreview = message.body.slice(0, 160);
        await conversation.save();
      }

      const dto = serializeMessage(message);
      io.to(roomName(conversationId)).emit("message:new", dto);
      const recipientId = conversation.participantIds.find(
        (participantId) => String(participantId) !== userId,
      );
      if (recipientId) {
        try {
          await ChatUser.updateOne(
            { _id: recipientId },
            {
              $addToSet: {
                notifications: {
                  _id: message._id,
                  type: "message",
                  title: "Yangi xabar",
                  message: `Sizga yangi xabar keldi: ${message.body.slice(0, 180)}`,
                  from: senderId,
                  createdAt: message.createdAt,
                  read: false,
                  actionUrl: `/desktop/messages?userId=${encodeURIComponent(userId)}${conversation.itemId ? `&itemId=${encodeURIComponent(String(conversation.itemId))}` : ""}`,
                },
              },
            },
          );
        } catch (notificationError) {
          console.error("Xabar bildirishnomasi saqlanmadi:", notificationError);
        }
      }
      conversation.participantIds.forEach((participantId) => {
        io.to(`user:${String(participantId)}`).emit("conversation:updated", {
          conversationId,
        });
      });
      callback({ ok: true, message: dto });
    } catch (error) {
      console.error("Xabar saqlanmadi:", error);
      callback({ ok: false, error: "Xabarni yuborib bo‘lmadi" });
    }
  });

  socket.on("message:read", async (payload) => {
    if (
      !payload
      || typeof payload.conversationId !== "string"
      || !Array.isArray(payload.messageIds)
    ) return;
    try {
      const { conversationId, messageIds } = payload;
      const conversation = await getAuthorizedConversation(conversationId, userId);
      if (!conversation || !Array.isArray(messageIds)) return;
      const validIds = messageIds
        .filter((id) => typeof id === "string" && Types.ObjectId.isValid(id))
        .slice(0, 100)
        .map((id) => new Types.ObjectId(id));
      if (!validIds.length) return;

      const readAt = new Date();
      const incomingMessages = await RealtimeMessage.find({
        _id: { $in: validIds },
        conversationId: conversation._id,
        senderId: { $ne: new Types.ObjectId(userId) },
      }).select("_id senderId");
      if (!incomingMessages.length) return;
      const incomingIds = incomingMessages.map(({ _id }) => _id);
      await RealtimeMessage.updateMany(
        {
          _id: { $in: incomingIds },
          "readBy.userId": { $ne: new Types.ObjectId(userId) },
        },
        { $push: { readBy: { userId: new Types.ObjectId(userId), readAt } } },
      );
      const readEvent = {
        conversationId,
        userId,
        messageIds: incomingIds.map(String),
        readAt: readAt.toISOString(),
      };
      new Set(incomingMessages.map(({ senderId }) => String(senderId))).forEach((senderId) => {
        io.to(`user:${senderId}`).emit("message:read", readEvent);
      });
    } catch (error) {
      console.error("Xabar o‘qilgani belgilanmadi:", error);
    }
  });
});

async function bootstrap() {
  await connectDatabase();
  await configureRedisAdapter(io);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`QaytarMe realtime server ${port}-portda ishlamoqda`);
  });
}

bootstrap().catch((error) => {
  console.error("Realtime server ishga tushmadi:", error);
  process.exit(1);
});
