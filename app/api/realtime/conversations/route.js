import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import {
  ChatItem,
  ChatUser,
  Conversation,
  Types,
  connectDatabase,
  serializeConversations,
} from "@/app/lib/realtime-data";

export const runtime = "nodejs";

async function getUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  return userId && Types.ObjectId.isValid(userId) ? userId : null;
}

export async function GET() {
  const userId = await getUser();
  if (!userId) {
    return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  }

  try {
    await connectDatabase();
    return NextResponse.json(await serializeConversations(userId), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Suhbatlar yuklanmadi:", error);
    return NextResponse.json(
      { error: "Suhbatlarni yuklab bo‘lmadi" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const userId = await getUser();
  if (!userId) {
    return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Suhbat ma’lumoti noto‘g‘ri" }, { status: 400 });
    }
    const recipientId = String(payload.recipientId || "");
    const itemId = payload.itemId ? String(payload.itemId) : "";
    if (
      !Types.ObjectId.isValid(recipientId)
      || recipientId === userId
      || (itemId && !Types.ObjectId.isValid(itemId))
    ) {
      return NextResponse.json({ error: "Suhbat ma’lumoti noto‘g‘ri" }, { status: 400 });
    }

    await connectDatabase();
    const [recipient, item] = await Promise.all([
      ChatUser.findById(recipientId).select("_id"),
      itemId ? ChatItem.findById(itemId).select("_id") : null,
    ]);
    if (!recipient) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    }
    if (itemId && !item) {
      return NextResponse.json({ error: "E’lon topilmadi" }, { status: 404 });
    }

    const participantIds = [userId, recipientId].sort();
    const participantKey = participantIds.join(":");
    const conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participantIds: participantIds.map((id) => new Types.ObjectId(id)),
          participantKey,
          startedBy: new Types.ObjectId(userId),
          status: "active",
          ...(itemId ? { itemId: new Types.ObjectId(itemId) } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ conversationId: String(conversation._id) }, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Suhbat yaratilmadi:", error);
    return NextResponse.json(
      { error: "Suhbat yaratib bo‘lmadi" },
      { status: 500 },
    );
  }
}
