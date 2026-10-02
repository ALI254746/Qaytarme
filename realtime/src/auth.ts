import { jwtVerify } from "jose";
import { Types } from "mongoose";

export type SocketPrincipal = {
  userId: string;
  role: "user" | "admin";
};

function getSecret() {
  const secret = process.env.SOCKET_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SOCKET_JWT_SECRET kamida 32 belgidan iborat bo‘lishi kerak");
  }
  return new TextEncoder().encode(secret);
}

export async function verifySocketToken(token: string): Promise<SocketPrincipal> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: "qaytarme-web",
    audience: "qaytarme-realtime",
  });

  if (
    typeof payload.sub !== "string"
    || !Types.ObjectId.isValid(payload.sub)
    || !["user", "admin"].includes(String(payload.role))
  ) {
    throw new Error("Socket token noto‘g‘ri");
  }

  return { userId: payload.sub, role: payload.role as SocketPrincipal["role"] };
}
