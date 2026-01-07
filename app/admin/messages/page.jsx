"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function AdminMessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const chatEndRef = React.useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, replyModalOpen]);

  const fetchMessages = async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`${getApiUrl("admin/notifications")}?t=${new Date().getTime()}`, {
        headers: { 
            "Authorization": `Bearer ${session.user.accessToken}`,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        // Filter only user messages
        const userMessages = data.filter(n => n.type === 'admin_message');
        setMessages(userMessages);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [session]);

  const handleReply = async (msg) => {
    setSelectedMessage(msg);
    setReplyModalOpen(true);
    setReplyText("");
    setChatHistory([]); // Clear previous

    if (session?.user?.accessToken && msg.from) {
        try {
            const res = await fetch(getApiUrl(`admin/chat-history/${msg.from}`), {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            });
            if (res.ok) {
                setChatHistory(await res.json());
            }
        } catch (error) {
            console.error("Failed to load history", error);
        }
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    setSending(true);
    try {
      const res = await fetch(getApiUrl("admin/reply-user"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          userId: selectedMessage.from,
          message: replyText
        })
      });

      if (res.ok) {
        alert("Javob yuborildi!");
        setReplyModalOpen(false);
        setReplyText("");
        setSelectedMessage(null);
      } else {
        alert("Xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Reply error:", error);
      alert("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderInitial = (msg) => {
    // Try to extract name from "Admin xabari (Name): Message"
    const match = msg.message.match(/Admin xabari \((.*?)\):/);
    if (match && match[1]) return match[1].charAt(0);
    return "?";
  };

  const cleanMessage = (msg) => {
    return msg.replace(/Admin xabari \(.*?\): /, "");
  };
  
  const getSenderName = (msg) => {
      const match = msg.message.match(/Admin xabari \((.*?)\):/);
      if (match && match[1]) return match[1];
      return "Foydalanuvchi";
  }

  const handleDelete = async (e, msgId) => {
    e.stopPropagation();
    console.log("Delete clicked for msgId:", msgId);
    
    if (!msgId) {
        alert("Xatolik: Xabar ID topilmadi");
        return;
    }
    if(!confirm("Haqiqatan ham bu xabarni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(getApiUrl(`admin/notifications/${msgId}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      console.log("Delete response:", res.status);
      if(res.ok) {
        // Remove from UI immediately
        setMessages(prev => prev.filter(m => m._id !== msgId));
        alert("Xabar o'chirildi");
      } else {
        const err = await res.json();
        console.error("Delete failed:", err);
        alert(`O'chirishda xatolik bo'ldi: ${err.message || 'Noma\'lum xatolik'}`);
      }
    } catch(e) { 
        console.error("Delete exception:", e);
        alert("Internet bilan aloqa yo'q yoki server ishlamayapti");
    }
  };

  if (loading && messages.length === 0) {
    return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2 transition-colors">Foydalanuvchi Xabarlari</h2>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Jami: {messages.length} ta xabar</p>
      </div>

      <div className="flex gap-4 justify-end">
        <button 
           onClick={async () => {
             if (!confirmClear) {
                 setConfirmClear(true);
                 // Auto-reset after 3 seconds
                 setTimeout(() => setConfirmClear(false), 3000);
                 return;
             }

             console.log("Tozalash tugmasi bosildi (Confirmed via UI)");
             
             if (!session?.user?.accessToken) {
                 console.warn("Token mavjud emas (No Token)");
                 return;
             }
             
             try {
                console.log("Tozalash so'rovi yuborilmoqda...");
                const res = await fetch(getApiUrl("admin/notifications/clear/all"), {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${session.user.accessToken}` }
                });
                
                console.log("Backend javobi:", res.status);
                if(res.ok) {
                    const data = await res.json();
                    console.log("Tozalash muvaffaqiyatli:", data);
                    setMessages([]);
                    alert("Barcha xabarlar o'chirildi");
                    setConfirmClear(false);
                } else {
                    const err = await res.json();
                    console.error("Tozalashda xatolik (Backend Error):", err);
                    alert("Xatolik: " + (err.message || res.statusText));
                }
             } catch(e) { 
                 console.error("Fetch xatosi (Network Error):", e);
                 alert("Internet xatosi");
             }
           }}
           className={`px-4 py-2 text-xs font-bold rounded-xl uppercase tracking-widest transition-all duration-300 ${
               confirmClear 
               ? "bg-red-500 text-white hover:bg-red-600 scale-105" 
               : "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
           }`}
        >
           {confirmClear ? "Tasdiqlash" : "Tozalash"}
        </button>

        <button 
           onClick={async () => {
             if (!session?.user?.accessToken) return;
             try {
                await fetch(getApiUrl("admin/notifications/read-all"), {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${session.user.accessToken}` }
                });
                alert("Barcha xabarlar o'qilgan deb belgilandi");
                // Optimistically mark all read just for UI (optional, or rely on next fetch)
                fetchMessages(); 
             } catch(e) {
                console.error(e);
             }
           }}
           className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
           O'qilgan deb belgilash
        </button>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              key={msg._id || index}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none relative overflow-hidden group transition-colors duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-mint/10 dark:bg-mint/20 rounded-2xl flex items-center justify-center text-xl font-black text-neutral-800 dark:text-mint transition-colors">
                    {getSenderInitial(msg)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{getSenderName(msg)}</h4>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">{formatTime(msg.createdAt)}</p>
                    </div>
                    <button 
                       onClick={(e) => handleDelete(e, msg._id)}
                       className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors relative z-10"
                       title="O'chirish"
                    >
                       <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

                <div className="bg-neutral-50 dark:bg-black/20 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 mb-6 min-h-[100px]">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                        "{cleanMessage(msg.message)}"
                    </p>
                </div>
              </div>

               <button 
                 onClick={() => handleReply(msg)}
                 className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
               >
                 <span>💬</span> Javob yozish
               </button>

              {/* Decorative side bar */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-mint opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {messages.length === 0 && !loading && (
        <div className="py-20 text-center bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800">
           <div className="w-20 h-20 bg-neutral-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-4xl opacity-20">📭</span>
           </div>
           <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Xabarlar mavjud emas</p>
        </div>
      )}

      {/* Reply Modal */}
      <AnimatePresence>
        {replyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-neutral-100 dark:border-neutral-800"
            >
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Javob yozish</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Foydalanuvchi: <span className="text-mint font-bold">{selectedMessage && getSenderName(selectedMessage)}</span>
              </p>

              {/* Chat History Area */}
              <div className="flex-1 overflow-y-auto max-h-[300px] mb-4 space-y-3 p-4 bg-neutral-50 dark:bg-black/20 rounded-2xl border border-neutral-100 dark:border-white/5">
                {chatHistory.length === 0 ? (
                    <p className="text-center text-xs text-neutral-400 italic">Tarix topilmadi</p>
                ) : (
                    chatHistory.map((chatMsg, cIdx) => {
                        // Check if sender is admin. 
                        // In admin service, we populated sender. 
                        // If sender.role === 'admin', it's outgoing.
                        // Or we check id.
                        const isMe = chatMsg.sender?._id === session?.user?.id || chatMsg.sender?.role === 'admin';
                        return (
                            <div key={cIdx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                    isMe 
                                    ? 'bg-mint text-neutral-900 rounded-tr-none' 
                                    : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-200 dark:border-white/10'
                                }`}>
                                    <p>{chatMsg.content}</p>
                                    <span className="text-[9px] opacity-50 block mt-1 text-right">
                                        {new Date(chatMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Xabaringizni yozing..."
                className="w-full h-24 bg-neutral-50 dark:bg-black/20 rounded-2xl p-4 text-neutral-900 dark:text-white placeholder-neutral-400 resize-none outline-none focus:ring-2 focus:ring-mint/50 border border-neutral-100 dark:border-white/5 mb-6 text-sm"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setReplyModalOpen(false)}
                  className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 py-4 bg-mint text-neutral-900 font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-xs shadow-lg shadow-mint/20"
                >
                  {sending ? "Yuborilmoqda..." : "Yuborish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
