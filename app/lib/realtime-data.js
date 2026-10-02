import { Types } from "mongoose";
import {
  ChatItem,
  ChatUser,
  Conversation,
  RealtimeMessage,
} from "../../realtime/src/models.ts";
import { connectDatabase } from "../../realtime/src/database.ts";

export { Types, ChatItem, ChatUser, Conversation, RealtimeMessage, connectDatabase };

export function serializeMessage(message) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    body: message.body,
    clientMessageId: message.clientMessageId,
    createdAt: new Date(message.createdAt).toISOString(),
    readBy: (message.readBy ?? []).map((entry) => ({
      userId: String(entry.userId),
      readAt: new Date(entry.readAt).toISOString(),
    })),
  };
}

export function serializeItem(item) {
  if (!item) return null;
  return {
    id: String(item._id),
    itemType: item.itemType ?? "",
    itemName: item.itemName ?? "",
    status: item.status ?? "",
    moderationStatus: item.moderationStatus ?? "",
    confirmedByFinder: Boolean(item.confirmedByFinder),
    confirmedByLoser: Boolean(item.confirmedByLoser),
    userId: item.user ? String(item.user) : "",
    imageUrl: item.image?.url ?? "",
  };
}

export async function serializeConversations(userId) {
  const userObjectId = new Types.ObjectId(userId);
  const conversations = await Conversation.find({
    participantIds: userObjectId,
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(100)
    .lean();

  if (!conversations.length) return [];

  const conversationIds = conversations.map((conversation) => conversation._id);
  const messageSummaries = await RealtimeMessage.aggregate([
    { $match: { conversationId: { $in: conversationIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$senderId", userObjectId] },
                  {
                    $not: [
                      {
                        $in: [
                          userObjectId,
                          { $ifNull: ["$readBy.userId", []] },
                        ],
                      },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const otherUserIds = conversations
    .map((conversation) =>
      conversation.participantIds.find((id) => String(id) !== userId),
    )
    .filter(Boolean);
  const itemIds = conversations.map((conversation) => conversation.itemId).filter(Boolean);
  const [users, items] = await Promise.all([
    ChatUser.find({ _id: { $in: otherUserIds } })
      .select("_id name avatar role")
      .lean(),
    ChatItem.find({ _id: { $in: itemIds } })
      .select("_id itemType itemName status moderationStatus confirmedByFinder confirmedByLoser user image")
      .lean(),
  ]);

  const userById = new Map(users.map((user) => [String(user._id), user]));
  const itemById = new Map(items.map((item) => [String(item._id), item]));
  const summaryById = new Map(
    messageSummaries.map((summary) => [String(summary._id), summary]),
  );

  return conversations.flatMap((conversation) => {
    const otherId = conversation.participantIds.find((id) => String(id) !== userId);
    const user = otherId ? userById.get(String(otherId)) : null;
    if (!user) return [];
    const summary = summaryById.get(String(conversation._id));
    const item = conversation.itemId
      ? itemById.get(String(conversation.itemId))
      : null;

    return [{
      id: String(conversation._id),
      status: conversation.status,
      user: {
        id: String(user._id),
        name: user.name || "Foydalanuvchi",
        avatar: user.avatar || "",
        role: user.role || "user",
      },
      item: serializeItem(item),
      unreadCount: summary?.unreadCount ?? 0,
      lastMessage: summary?.lastMessage
        ? serializeMessage(summary.lastMessage)
        : null,
    }];
  });
}
