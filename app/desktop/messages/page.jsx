"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { ChatHeader } from "@/app/components/messages/ChatHeader";
import { ChatList } from "@/app/components/messages/ChatList";
import { ChatMessages } from "@/app/components/messages/ChatMessages";
import { HandoverCard } from "@/app/components/messages/HandoverCard";
import { MessageInput } from "@/app/components/messages/MessageInput";
import {
  connectChatSocket,
  disconnectChatSocket,
  refreshChatSocketToken,
} from "@/app/lib/socket-client";

async function getJson(url, options) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "So‘rov bajarilmadi");
  return data;
}

export default function MessagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const userId = session?.user?.id;
  const accessToken = session?.user?.accessToken;
  const initialUserId = searchParams.get("userId");
  const initialItemId = searchParams.get("itemId");

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageError, setMessageError] = useState("");
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [socketError, setSocketError] = useState("");
  const socketRef = useRef(null);
  const selectedIdRef = useRef("");
  const handledInitialUser = useRef("");
  const typingTimer = useRef(null);
  const pendingReadRef = useRef(null);

  const selectedConversation = conversations.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getJson("/api/realtime/conversations");
      setConversations(data);
      setListError("");
    } catch (error) {
      setListError(error.message);
    } finally {
      setConversationsLoading(false);
    }
  }, [userId]);

  function flushPendingRead(socket) {
    const pending = pendingReadRef.current;
    if (!pending || !socket?.connected) return;
    socket.emit("message:read", pending);
    pendingReadRef.current = null;
  }

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!userId) {
      setConversations([]);
      setConversationsLoading(false);
      return;
    }
    setConversationsLoading(true);
    void fetchConversations();
  }, [fetchConversations, sessionStatus, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    let tokenTimer;

    const start = async () => {
      try {
        const socket = await connectChatSocket();
        if (!active) {
          disconnectChatSocket();
          return;
        }
        socketRef.current = socket;

        const joinSelected = () => {
          setConnected(true);
          setSocketError("");
          const conversationId = selectedIdRef.current;
          if (conversationId) {
            socket.emit("conversation:join", { conversationId }, (result) => {
              if (!result.ok) setSocketError(result.error || "Suhbatga ulanib bo‘lmadi");
            });
          }
          flushPendingRead(socket);
        };
        const handleDisconnect = () => setConnected(false);
        const handleConnectError = async (error) => {
          setConnected(false);
          setSocketError(error.message || "Real-time ulanish amalga oshmadi");
          try {
            await refreshChatSocketToken();
            if (active) socket.connect();
          } catch (tokenError) {
            setSocketError(tokenError.message);
          }
        };
        const handleNewMessage = (message) => {
          if (message.conversationId !== selectedIdRef.current) return;
          setMessages((current) => {
            const same = current.findIndex(
              (item) => item.id === message.id || item.clientMessageId === message.clientMessageId,
            );
            if (same < 0) return [...current, message];
            return current.map((item, index) => index === same ? message : item);
          });
          setTyping(false);
        };
        const handleTyping = (event) => {
          if (
            event.conversationId === selectedIdRef.current
            && event.userId !== userId
          ) setTyping(event.typing);
        };
        const handleRead = (event) => {
          if (event.conversationId !== selectedIdRef.current) return;
          setMessages((current) => current.map((message) =>
            event.messageIds.includes(message.id)
              ? {
                  ...message,
                  readBy: [
                    ...(message.readBy ?? []).filter((entry) => entry.userId !== event.userId),
                    { userId: event.userId, readAt: event.readAt },
                  ],
                }
              : message,
          ));
        };

        socket.on("connect", joinSelected);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("message:new", handleNewMessage);
        socket.on("typing:changed", handleTyping);
        socket.on("message:read", handleRead);
        socket.on("conversation:updated", fetchConversations);
        if (socket.connected) joinSelected();

        tokenTimer = setInterval(() => {
          void refreshChatSocketToken().catch((error) => setSocketError(error.message));
        }, 4 * 60 * 1000);

        socketRef.current.cleanup = () => {
          socket.off("connect", joinSelected);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("message:new", handleNewMessage);
          socket.off("typing:changed", handleTyping);
          socket.off("message:read", handleRead);
          socket.off("conversation:updated", fetchConversations);
        };
      } catch (error) {
        if (active) setSocketError(error.message || "Real-time chatga ulanib bo‘lmadi");
      }
    };

    void start();
    return () => {
      active = false;
      clearInterval(tokenTimer);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      const socket = socketRef.current;
      const conversationId = selectedIdRef.current;
      if (conversationId) socket?.emit("conversation:leave", { conversationId });
      socket?.cleanup?.();
      disconnectChatSocket();
      socketRef.current = null;
    };
  }, [fetchConversations, userId]);

  useEffect(() => {
    if (!selectedId || !userId) {
      setMessages([]);
      return undefined;
    }
    let active = true;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("conversation:join", { conversationId: selectedId }, (result) => {
        if (!result.ok && active) setMessageError(result.error || "Suhbatga ulanib bo‘lmadi");
      });
    }

    setMessagesLoading(true);
    setMessageError("");
    getJson(`/api/realtime/conversations/${selectedId}/messages`)
      .then((data) => {
        if (!active) return;
        setMessages(data.messages);
        const incomingMessageIds = data.messages
          .filter((message) => message.senderId !== userId)
          .map((message) => message.id);
        if (incomingMessageIds.length) {
          pendingReadRef.current = {
            conversationId: selectedId,
            messageIds: incomingMessageIds,
          };
          flushPendingRead(socketRef.current);
        }
        setConversations((current) => current.map((item) =>
          item.id === selectedId ? { ...item, unreadCount: 0 } : item,
        ));
      })
      .catch((error) => {
        if (active) setMessageError(error.message);
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
      socket?.emit("conversation:leave", { conversationId: selectedId });
    };
  }, [selectedId, userId]);

  useEffect(() => {
    if (!userId || !initialUserId || conversationsLoading) return;
    const requestKey = `${initialUserId}:${initialItemId ?? ""}`;
    if (handledInitialUser.current === requestKey) return;
    handledInitialUser.current = requestKey;

    const existing = conversations.find((conversation) => conversation.user.id === initialUserId);
    if (existing) {
      setSelectedId(existing.id);
      setMobileChatOpen(true);
      return;
    }

    getJson("/api/realtime/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientId: initialUserId, itemId: initialItemId }),
    })
      .then(async ({ conversationId }) => {
        await fetchConversations();
        setSelectedId(conversationId);
        setMobileChatOpen(true);
      })
      .catch((error) => setListError(error.message));
  }, [conversations, conversationsLoading, fetchConversations, initialItemId, initialUserId, userId]);

  useEffect(() => {
    if (!selectedId || !connected || !socketRef.current) return;
    socketRef.current.emit("conversation:join", { conversationId: selectedId }, (result) => {
      if (!result.ok) setMessageError(result.error || "Suhbatga ulanib bo‘lmadi");
    });
  }, [connected, selectedId]);

  function selectConversation(conversation) {
    setSelectedId(conversation.id);
    setMobileChatOpen(true);
    setTyping(false);
  }

  function handleTyping(value) {
    setMessageText(value);
    const socket = socketRef.current;
    if (!socket?.connected || !selectedId) return;
    socket.emit("typing:start", { conversationId: selectedId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: selectedId });
    }, 1000);
  }

  function sendMessage(event) {
    event.preventDefault();
    const body = messageText.trim();
    const socket = socketRef.current;
    if (!body || !selectedConversation || selectedConversation.status !== "active") return;
    if (!socket?.connected) {
      setMessageError(socketError || "Server bilan aloqa yo‘q. Qayta urinib ko‘ring.");
      return;
    }

    const clientMessageId = crypto.randomUUID();
    const optimistic = {
      id: `pending:${clientMessageId}`,
      conversationId: selectedConversation.id,
      senderId: userId,
      body,
      clientMessageId,
      createdAt: new Date().toISOString(),
      readBy: [{ userId, readAt: new Date().toISOString() }],
    };
    setMessages((current) => [...current, optimistic]);
    setMessageText("");
    setMessageError("");
    socket.emit(
      "message:send",
      { conversationId: selectedConversation.id, body, clientMessageId },
      (result) => {
        if (!result.ok) {
          setMessages((current) => current.filter((message) => message.clientMessageId !== clientMessageId));
          setMessageText(body);
          setMessageError(result.error);
          return;
        }
        setMessages((current) => {
          const index = current.findIndex((message) => message.clientMessageId === clientMessageId);
          if (index < 0) return [...current, result.message];
          return current.map((message, currentIndex) => currentIndex === index ? result.message : message);
        });
        void fetchConversations();
      },
    );
    socket.emit("typing:stop", { conversationId: selectedConversation.id });
  }

  function updateSelectedItem(item) {
    setConversations((current) => current.map((conversation) =>
      conversation.id === selectedId ? { ...conversation, item } : conversation,
    ));
  }

  const isSignedOut = sessionStatus !== "loading" && !userId;

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={`${mobileChatOpen ? "hidden" : "flex"} min-h-0 w-full md:flex md:w-auto`}>
        <ChatList
          conversations={conversations}
          activeId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={selectConversation}
          loading={conversationsLoading || sessionStatus === "loading"}
          error={listError || (isSignedOut ? "Suhbatlarni ko‘rish uchun tizimga kiring." : "")}
          loginRequired={isSignedOut}
          onRetry={fetchConversations}
        />
      </div>

      <section className={`${mobileChatOpen ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col md:flex`}>
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              connected={connected}
              onBack={() => setMobileChatOpen(false)}
            />
            {socketError && <p role="status" className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{socketError}</p>}
            {selectedConversation.item && (
              <HandoverCard
                item={selectedConversation.item}
                currentUserId={userId}
                otherUserId={selectedConversation.user.id}
                accessToken={accessToken}
                onUpdated={updateSelectedItem}
              />
            )}
            <ChatMessages
              messages={messages}
              currentUserId={userId}
              otherUserId={selectedConversation.user.id}
              typing={typing}
              loading={messagesLoading}
            />
            <MessageInput
              value={messageText}
              onChange={handleTyping}
              onSubmit={sendMessage}
              disabled={!userId || selectedConversation.status !== "active"}
              error={messageError}
            />
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center bg-[#f6f8f7] px-8 text-center dark:bg-slate-900 md:flex">
            {isSignedOut ? (
              <>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Avval tizimga kiring</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Xabarlar va suhbatlar faqat profilingizga kirganingizda ochiladi.</p>
                <Link href="/login" className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Kirish</Link>
              </>
            ) : (
              <>
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
                  <MessagesSquare className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">Suhbatni tanlang</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">E’lon egasi bilan yozishmalar va buyumni topshirish tasdiqlari shu yerda ko‘rinadi.</p>
              </>
            )}
          </div>
        )}
        {!selectedConversation && mobileChatOpen && (
          <button type="button" onClick={() => setMobileChatOpen(false)} className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 md:hidden" aria-label="Suhbatlar ro‘yxatiga qaytish">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </section>
    </div>
  );
}
