export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId: string;
  createdAt: string;
  readBy: Array<{ userId: string; readAt: string }>;
};

export type SendMessagePayload = {
  conversationId: string;
  body: string;
  clientMessageId: string;
};

export type JoinConversationPayload = {
  conversationId: string;
};

export type MessageAcknowledgement =
  | { ok: true; message: ChatMessageDto }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  "conversation:join": (
    payload: JoinConversationPayload,
    callback: (result: { ok: boolean; error?: string }) => void,
  ) => void;
  "conversation:leave": (payload: JoinConversationPayload) => void;
  "message:send": (
    payload: SendMessagePayload,
    callback: (result: MessageAcknowledgement) => void,
  ) => void;
  "message:read": (payload: {
    conversationId: string;
    messageIds: string[];
  }) => void;
  "typing:start": (payload: JoinConversationPayload) => void;
  "typing:stop": (payload: JoinConversationPayload) => void;
}

export interface ServerToClientEvents {
  "message:new": (message: ChatMessageDto) => void;
  "conversation:updated": (payload: { conversationId: string }) => void;
  "message:read": (payload: {
    conversationId: string;
    userId: string;
    messageIds: string[];
    readAt: string;
  }) => void;
  "typing:changed": (payload: {
    conversationId: string;
    userId: string;
    typing: boolean;
  }) => void;
}
