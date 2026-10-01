import mongoose, { Schema, Types, type Document, type Model } from "mongoose";

export interface ChatConversation extends Document {
  participantIds: Types.ObjectId[];
  participantKey: string;
  itemId?: Types.ObjectId;
  startedBy: Types.ObjectId;
  status: "active" | "closed";
  lastMessageAt?: Date;
  lastMessagePreview: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ChatConversation>(
  {
    participantIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      required: true,
      validate: {
        validator: (ids: Types.ObjectId[]) =>
          ids.length === 2
          && Boolean(ids[0] && ids[1] && ids[0].toString() !== ids[1].toString()),
        message: "A conversation must have two different participants",
      },
    },
    participantKey: { type: String, required: true, unique: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Ariza", default: null },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "closed"], default: "active", index: true },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, default: "" },
  },
  { timestamps: true },
);
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

export interface ChatMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  clientMessageId: string;
  legacyMessageId?: string;
  readBy: Array<{ userId: Types.ObjectId; readAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, maxlength: 3000 },
    clientMessageId: { type: String, required: true, maxlength: 100 },
    legacyMessageId: { type: String, default: undefined },
    readBy: {
      type: [{
        _id: false,
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, required: true },
      }],
      default: [],
    },
  },
  { timestamps: true, collection: "realtime_messages" },
);
chatMessageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true },
);
chatMessageSchema.index(
  { legacyMessageId: 1 },
  { unique: true, sparse: true },
);
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

const userSchema = new Schema({}, { strict: false, collection: "users" });
const itemSchema = new Schema({}, { strict: false, collection: "arizas" });

type ChatUserDocument = Document & {
  notifications?: Array<{
    _id: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    from: string;
    createdAt: Date;
    read: boolean;
    actionUrl: string;
  }>;
};

export const Conversation: Model<ChatConversation> =
  (mongoose.models.Conversation as Model<ChatConversation> | undefined)
  ?? mongoose.model<ChatConversation>("Conversation", conversationSchema);
export const RealtimeMessage: Model<ChatMessage> =
  (mongoose.models.RealtimeMessage as Model<ChatMessage> | undefined)
  ?? mongoose.model<ChatMessage>("RealtimeMessage", chatMessageSchema);
export const ChatUser: Model<ChatUserDocument> =
  (mongoose.models.ChatUser as Model<ChatUserDocument> | undefined)
  ?? mongoose.model<ChatUserDocument>("ChatUser", userSchema);
export const ChatItem = mongoose.models.ChatItem ?? mongoose.model("ChatItem", itemSchema);

export { Types };
