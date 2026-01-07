"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getApiUrl, API_BASE_URL } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { io } from "socket.io-client";

export default function MobileMessagesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await fetch(getApiUrl("messages"), {
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [session]);

  // Real-time updates for list
  useEffect(() => {
    if (!session?.user?.id) return;
    const socket = io(API_BASE_URL, {
        query: { userId: session.user.id }
    });

    socket.on("receiveMessage", () => {
        fetchConversations();
    });

    return () => socket.disconnect();
  }, [session?.user?.id]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24">
       {/* Header */}
       <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5 px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-xl text-neutral-900 dark:text-white">{t('messages_title') || "Xabarlar"}</h1>
          <button className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-500">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
       </div>

       {/* List */}
       <div className="p-2 space-y-1">
          {loading ? (
             [1,2,3].map(n => (
                <div key={n} className="flex gap-4 p-4 items-center">
                   <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                   <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
                   </div>
                </div>
             ))
          ) : conversations.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm font-medium">{t('no_messages_title')}</p>
             </div>
          ) : (
             conversations.map((conv, index) => (
                <motion.div
                   key={conv._id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.05 }}
                   onClick={() => router.push(`/mobile/messages/${conv.user._id}`)}
                   className="p-3 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900 rounded-2xl flex items-center gap-3 relative overflow-hidden transition-colors border border-transparent dark:border-white/5"
                >
                    <div className="relative shrink-0">
                       <img 
                          src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.name}`} 
                          className="w-14 h-14 rounded-full bg-neutral-100 object-cover" 
                       />
                       {conv.unreadCount > 0 && (
                          <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-black">
                             {conv.unreadCount}
                          </div>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-0.5">
                          <h4 className="font-bold text-neutral-900 dark:text-white truncate text-base">
                             {conv.user.role === 'admin' ? (t('admin_support_name') || "QaytarMe Support") : conv.user.name}
                             {conv.user.role === 'admin' && <span className="ml-1 text-[9px] bg-mint px-1 rounded text-neutral-900 align-middle">ADMIN</span>}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap ml-2">
                             {formatTime(conv.lastMessage.createdAt)}
                          </span>
                       </div>
                       <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {conv.lastMessage.content}
                       </p>
                    </div>
                </motion.div>
             ))
          )}
       </div>
    </div>
  );
}
