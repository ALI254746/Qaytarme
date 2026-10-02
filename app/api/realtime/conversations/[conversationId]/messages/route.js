import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import {
  Conversation,
  RealtimeMessage,
  Types,
  connectDatabase,
  serializeMessage,
} from "@/app/lib/realtime-data";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { conversationId } = await params;
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  }
  if (!Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });
  }

  try {
    await connectDatabase();
    const userObjectId = new Types.ObjectId(userId);
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userObjectId,
    }).lean();
    if (!conversation) {
      return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });
    }

    const messages = await RealtimeMessage.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    const unreadIds = messages
      .filter((message) =>
        String(message.senderId) !== userId
        && !(message.readBy ?? []).some((entry) => String(entry.userId) === userId),
      )
      .map((message) => message._id);
    const readAt = new Date();
    if (unreadIds.length) {
      await RealtimeMessage.updateMany(
        { _id: { $in: unreadIds }, "readBy.userId": { $ne: userObjectId } },
        { $push: { readBy: { userId: userObjectId, readAt } } },
      );
    }

    const result = messages.reverse().map((message) => ({
      ...serializeMessage(message),
      readBy: [
        ...(message.readBy ?? []).map((entry) => ({
          userId: String(entry.userId),
          readAt: new Date(entry.readAt).toISOString(),
        })),
        ...(unreadIds.some((id) => String(id) === String(message._id))
          ? [{ userId, readAt: readAt.toISOString() }]
          : []),
      ],
    }));

    return NextResponse.json({
      conversation: {
        id: String(conversation._id),
        status: conversation.status,
      },
      messages: result,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Xabarlar yuklanmadi:", error);
    return NextResponse.json(
      { error: "Xabarlarni yuklab bo‘lmadi" },
      { status: 500 },
    );
  }
}
