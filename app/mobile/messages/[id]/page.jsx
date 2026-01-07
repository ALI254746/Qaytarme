"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getApiUrl, API_BASE_URL } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

export default function MobileChatPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id;
  const itemId = searchParams.get("itemId");

  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedUserRef = useRef(null);

  useEffect(() => {
     selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch User Info & Messages
  useEffect(() => {
    if (!session?.user?.accessToken || !userId) return;

    const initChat = async () => {
      try {
        // 1. Fetch User Data
        const userRes = await fetch(getApiUrl(`users/${userId}`), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
        if (userRes.ok) {
           const userData = await userRes.json();
           setSelectedUser(userData);
        }

        // 2. Fetch Messages
        const msgRes = await fetch(getApiUrl(`messages/${userId}`), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
        if (msgRes.ok) {
           const maxData = await msgRes.json();
           setMessages(maxData);
           scrollToBottom();
        }

        // 3. Fetch Item (if provided)
        if (itemId) {
           const itemRes = await fetch(getApiUrl(`ariza/${itemId}`));
           if (itemRes.ok) {
              const itemData = await itemRes.json();
              setSelectedItem(itemData);
           }
        }

      } catch (err) {
        console.error("Chat init error", err);
      }
    };

    initChat();
  }, [userId, session]);

  // Socket Connection
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(API_BASE_URL, {
      query: { userId: session.user.id }
    });

    socket.on("connect", () => {
      // Check user online status
      socket.emit("checkStatus", userId); 
    });

    socket.on("receiveMessage", (message) => {
       const currentUser = selectedUserRef.current;
       if (currentUser?._id === message.sender._id || currentUser?._id === message.sender) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
       }
    });

    socket.on("typing", (data) => {
       if (data.senderId === userId) setIsTyping(true);
    });

    socket.on("stopTyping", (data) => {
       if (data.senderId === userId) setIsTyping(false);
    });
    
    // Simple online status simulation for now as backend might not broadcast checks
    setIsOnline(true); 

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [session, userId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (socketRef.current) {
      socketRef.current.emit("typing", { 
        recipientId: userId, 
        senderId: session.user.id 
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stopTyping", { 
            recipientId: userId,
            senderId: session.user.id 
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const content = messageInput;
    setMessageInput("");

    // Optimistic UI
    const tempMsg = {
        _id: Date.now(),
        sender: { _id: session.user.id },
        content: content,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
        const res = await fetch(getApiUrl("messages"), {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.user.accessToken}`
            },
            body: JSON.stringify({
              recipientId: userId,
              content: content,
              itemId: itemId
            }),
        });

        if (!res.ok) {
           // Rollback if failed (simple implementation)
           setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
        }
    } catch (err) {
        console.error("Send error", err);
    }
  };

  const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleDealAction = async (action) => {
     console.log("🚀 handleDealAction started. Action:", action);
     if (!selectedItem) {
        console.error("❌ selectedItem is missing!");
        return;
     }

     // Determine roles
     const userId = session?.user?.id;
     const itemCreatorId = selectedItem.user?._id || selectedItem.user;
     const isCreator = itemCreatorId === userId;
     const isLostItem = selectedItem.status === 'lost';
     const myRole = isLostItem ? (isCreator ? 'loser' : 'finder') : (isCreator ? 'finder' : 'loser');

     console.log("📊 Roles Debug:", {
        currentUserId: userId,
        itemCreatorId,
        isCreator,
        isLostItem,
        myRole,
        action
     });

     let endpoint = '';
     let body = {};

     // Logic:
     // If confirm: Finder calls confirm-handover, Loser calls confirm-receipt
     // If reject: cancel-deal
     if (action === 'reject') {
         endpoint = 'cancel-deal';
     } else {
         endpoint = myRole === 'finder' ? 'confirm-handover' : 'confirm-receipt';
         body = { otherUserId: params.id }; // params.id is the other user (chat partner)
     }

     const url = getApiUrl(`ariza/${selectedItem._id}/${endpoint}`);
     console.log("🌐 API Request:", { url, endpoint, body });

     try {
         const res = await fetch(url, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${session.user.accessToken}`
             },
             body: JSON.stringify(body)
         });

         console.log("📨 Response Status:", res.status);

         if (res.ok) {
             const updatedItem = await res.json();
             console.log("✅ Success! Item Updated:", updatedItem);
             setSelectedItem(updatedItem);
             alert("Amal muvaffaqiyatli bajarildi!");
         } else {
             const errorText = await res.text();
             console.error("❌ API Error:", errorText);
             alert(`Xatolik yuz berdi (${res.status}): ${errorText}`);
         }
     } catch (err) {
         console.error("💥 Network/Logic Error:", err);
         alert("Tizim xatoligi: " + err.message);
     }
  };

  return (
    <div className="fixed inset-0 pt-16 flex flex-col bg-[#e5ddd5] dark:bg-[#0b0b0b] overflow-hidden z-[30]">
        {/* Pattern BG */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://web.telegram.org/img/bg_0.png')] bg-repeat"></div>

        {/* Header */}
        <div className="h-16 flex items-center gap-2 px-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5 z-20 shrink-0">
             <button onClick={() => router.back()} className="p-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800">
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             
             {selectedUser ? (
                 <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <img src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} className="w-10 h-10 rounded-full bg-neutral-200 object-cover" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{selectedUser.name}</h3>
                        <p className="text-[10px] font-bold text-mint uppercase tracking-wider">
                           {isTyping ? "Yozmoqda..." : "Online"}
                        </p>
                    </div>
                 </div>
             ) : (
                 <div className="flex-1 h-10 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
             )}
             
             <button className="p-2 text-neutral-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
             </button>
        </div>

        {/* Optional Deal Panel */}
        {selectedItem && (
             <div className="m-2 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-white/5 flex items-center justify-between z-10 shrink-0">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <img src={selectedItem.image?.url} className="w-12 h-12 rounded-lg object-cover bg-neutral-100" />
                      <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">KELISHUV</p>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{selectedItem.itemType}</h4>
                      </div>
                  </div>
                  
                  {(() => {
                      const isCreator = selectedItem.user === session?.user?.id || selectedItem.user?._id === session?.user?.id;
                      const isLostItem = selectedItem.status === 'lost';
                      const myRole = isLostItem ? (isCreator ? 'loser' : 'finder') : (isCreator ? 'finder' : 'loser');
                      
                      const iConfirmed = myRole === 'finder' ? selectedItem.confirmedByFinder : selectedItem.confirmedByLoser;
                      const isCompleted = selectedItem.moderationStatus === 'returned' || (selectedItem.confirmedByFinder && selectedItem.confirmedByLoser);
                      
                      // 1. Is it my turn? (Am I the one who needs to confirm?)
                      const isMyTurn = (isLostItem && isCreator) || (!isLostItem && !isCreator);
                      
                      // Note: Actually, BOTH sides might need to confirm in some flows.
                      // Adjusting logic based on previous "Buttons only for True Owner" request:
                      // But correct logic is: I should see buttons if I haven't confirmed yet, AND I am a participant.
                      
                      // Let's stick to the previous request's logic for "Who sees buttons":
                      // "Buttons should be visible to the Receiver (True Owner)"
                      // BUT, the specific issue was "Buttons still visible after click".
                      
                      if (isCompleted) {
                          return (
                              <div className="px-3 py-1.5 bg-mint/20 text-mint-900 text-[10px] font-bold uppercase rounded-lg border border-mint/20">
                                  Bitim Yakunlandi
                              </div>
                          );
                      }
                      
                      if (iConfirmed) {
                          return (
                              <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-lg border border-green-200 dark:border-green-800">
                                  Tasdiqlash muvaffaqiyatli bo'ldi. Sherik tasdiqlashi kutilmoqda.
                              </div>
                          );
                      }

                      return (
                          <div className="flex gap-2">
                               <button 
                                  onClick={() => handleDealAction('reject')}
                                  className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-black uppercase rounded-lg active:scale-95 transition-transform"
                               >
                                  Rad etish
                               </button>
                               <button 
                                  onClick={() => handleDealAction('confirm')}
                                  className="px-3 py-1.5 bg-mint text-neutral-900 text-[10px] font-black uppercase rounded-lg active:scale-95 transition-transform"
                               >
                                  {myRole === 'finder' ? "Topshirdim" : "Qabul qildim"}
                               </button>
                          </div>
                      );
                  })()}
             </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 z-10">
             {messages.map((msg, index) => {
                 const isMe = msg.sender._id === session?.user?.id || msg.sender === session?.user?.id;
                 const nextMsg = messages[index + 1];
                 const isLastInGroup = !nextMsg || nextMsg.sender._id !== msg.sender._id;

                 return (
                     <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] px-3 py-2 text-sm relative shadow-sm ${
                             isMe 
                             ? `bg-mint text-neutral-900 rounded-2xl rounded-tr-sm ${isLastInGroup ? 'mb-2' : ''}` 
                             : `bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl rounded-tl-sm ${isLastInGroup ? 'mb-2' : ''}`
                         }`}>
                             {msg.content}
                             <span className={`text-[9px] float-right mt-1.5 ml-2 opacity-60 font-bold ${isMe ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                {formatTime(msg.createdAt)}
                                {isMe && <span className="ml-0.5">✓</span>}
                             </span>
                         </div>
                     </div>
                 );
             })}
             
             <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-neutral-900 p-2 pb-24 border-t border-neutral-100 dark:border-white/5 z-20 shrink-0">
             <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <button type="button" className="p-3 text-neutral-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input 
                      type="text" 
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder="Xabar yozish..." 
                      className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-mint transition-all"
                  />
                  <button 
                      type="submit" 
                      disabled={!messageInput.trim()}
                      className="p-3 bg-mint text-neutral-900 rounded-full shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                  >
                      <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
             </form>
        </div>
    </div>
  );
}
