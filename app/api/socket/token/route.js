import { SignJWT } from "jose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

function getSecret() {
  const secret = process.env.SOCKET_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SOCKET_JWT_SECRET kamida 32 belgidan iborat bo‘lishi kerak");
  }
  return new TextEncoder().encode(secret);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  }

  try {
    const token = await new SignJWT({ role: user.role || "user" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer("qaytarme-web")
      .setAudience("qaytarme-realtime")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(getSecret());

    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Socket token yaratilmadi:", error);
    return NextResponse.json(
      { error: "Real-time ulanish uchun token yaratilmadi" },
      { status: 500 },
    );
  }
}
