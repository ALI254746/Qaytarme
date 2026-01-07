"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl, API_BASE_URL } from "@/lib/api-config";
import { io } from "socket.io-client";
import { useSnackbar } from "notistack";
import { useLanguage } from "@/context/LanguageContext";

const transitionProps = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeInOut" }
};

export default function MessagesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUserId = searchParams.get("userId");

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Mobile View State
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'chat'

  // Sync ref with state
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Handle Mobile Back Button
  useEffect(() => {
    if (selectedUser) {
      setMobileView("chat");
    } else {
      setMobileView("list");
    }
  }, [selectedUser]);

  // Initialize Socket (One-time connection per session)
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(API_BASE_URL, {
      query: { userId: session.user.id }
    });

    socket.on("receiveMessage", (message) => {
      const currentSelectedUser = selectedUserRef.current;
      // If the message is from the selected user, add it to chat
      if (currentSelectedUser?._id === message.sender._id || currentSelectedUser?._id === message.sender) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      }
      fetchConversations();
    });

    socket.on("typing", (data) => {
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser?._id === data.senderId) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", (data) => {
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser?._id === data.senderId) {
        setIsTyping(false);
      }
    });

    socket.on("messageDeleted", (data) => {
      console.log("Message deleted event received:", data);
      if (data?.messageId) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id]);

  // Fetch list of conversations
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

  const [messagesLoading, setMessagesLoading] = useState(false);

  // Fetch messages for selected user
  const fetchMessages = async (userId) => {
    if (!userId || !session?.user?.accessToken) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(getApiUrl(`messages/${userId}`), {
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchConversations();
    }
  }, [session]);

  // Handle URL param to auto-select user
  useEffect(() => {
    const handleInitialUser = async () => {
      if (!initialUserId || !session?.user?.accessToken) return;

      const existingConv = conversations.find(c => c.user._id === initialUserId);
      if (existingConv) {
        setSelectedUser({ _id: existingConv.user._id, ...existingConv.user });
        fetchMessages(existingConv.user._id);
        return;
      }

      try {
        const res = await fetch(getApiUrl(`users/${initialUserId}`), {
          headers: {
            "Authorization": `Bearer ${session.user.accessToken}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setSelectedUser(userData);
          fetchMessages(initialUserId);
        }
      } catch (error) {
        console.error("Error fetching initial user:", error);
      }
    };

    if (session?.user?.accessToken) {
       handleInitialUser();
    }
  }, [initialUserId, session, conversations.length > 0]);

  // Fetch item details if itemId is in URL or manually selected
  useEffect(() => {
    const itemId = searchParams.get("itemId");
    const idToFetch = itemId || (typeof selectedItem === 'string' ? selectedItem : null);
    
    if (idToFetch) {
      fetch(getApiUrl(`ariza/${idToFetch}`))
        .then(res => res.json())
        .then(data => setSelectedItem(data))
        .catch(err => console.error("Error fetching item:", err));
    }
  }, [searchParams, typeof selectedItem === 'string']);

  // Periodic conversion refresh
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (socketRef.current && selectedUser) {
      socketRef.current.emit("typing", { 
        recipientId: selectedUser._id, 
        senderId: session.user.id 
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stopTyping", { 
          recipientId: selectedUser._id, 
          senderId: session.user.id 
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const content = messageInput;
    setMessageInput("");
    
    // Stop typing immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("stopTyping", { 
      recipientId: selectedUser._id, 
      senderId: session.user.id 
    });

    // Optimistic update
    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: session.user.id }, 
      recipient: selectedUser._id,
      content: content,
      item: searchParams.get("itemId") ? { _id: searchParams.get("itemId") } : null,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(getApiUrl("messages"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          recipientId: selectedUser._id,
          content: content,
          itemId: searchParams.get("itemId")
        }),
      });

      if (!res.ok) {
        setMessages(prev => prev.filter(m => m._id !== tempId));
      } else {
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const handleDealAction = async (action) => {
    if (!selectedItem || !selectedUser) return;
    
    try {
      let endpoint = '';
      let body = {};

      if (action === 'cancel') {
          endpoint = 'cancel-deal';
      } else {
          endpoint = action === 'handover' ? 'confirm-handover' : 'confirm-receipt';
          body = { otherUserId: selectedUser._id };
      }

      const res = await fetch(getApiUrl(`ariza/${selectedItem._id}/${endpoint}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setSelectedItem(updatedItem);
        enqueueSnackbar(t('profile_save_success'), { variant: 'success' });
        
        // Agar bitim to'liq yakunlangan bo'lsa (Backendda status o'zgardi deb faraz qilsak)
        if (updatedItem.confirmedByFinder && updatedItem.confirmedByLoser) {
           enqueueSnackbar(t('deal_status_completed'), { variant: 'success' });
        }
      } else {
        enqueueSnackbar(t('error_generic') || "Xatolik", { variant: 'error' });
      }
    } catch (error) {
       console.error("Deal action error:", error);
       enqueueSnackbar(t('error_generic') || "Xatolik", { variant: 'error' });
    }
  };

  const DealPanel = () => {
    if (!selectedItem || !session?.user?.id) return null;
    
    // Determine roles
    // If item.status == 'lost': Creator is Loser.
    // If item.status == 'found': Creator is Finder.
    
    const isCreator = selectedItem.user === session.user.id || selectedItem.user?._id === session.user.id;
    const isLostItem = selectedItem.status === 'lost';
    
    let myRole = ''; // 'finder' or 'loser'
    
    if (isLostItem) {
       myRole = isCreator ? 'loser' : 'finder';
    } else {
       myRole = isCreator ? 'finder' : 'loser';
    }
    
    // Check current status
    const iConfirmed = myRole === 'finder' ? selectedItem.confirmedByFinder : selectedItem.confirmedByLoser;
    const otherConfirmed = myRole === 'finder' ? selectedItem.confirmedByLoser : selectedItem.confirmedByFinder;
    
    // If already fully completed/returned
    if (selectedItem.moderationStatus === 'returned' || (selectedItem.confirmedByFinder && selectedItem.confirmedByLoser)) {
       return (
          <div className="mx-4 mt-4 p-4 bg-mint/10 border border-mint/20 rounded-2xl flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center text-xl">🎉</div>
                <div>
                   <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{t('deal_status_completed')}</h4>
                   <p className="text-[10px] text-neutral-500">{t('stat_returned')}</p>
                </div>
             </div>
          </div>
       );
    }

    return (
       <div className="mx-4 mt-4 p-4 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-3">
                {selectedItem.image?.url && (
                   <img src={selectedItem.image.url} className="w-10 h-10 rounded-lg object-cover bg-neutral-100" />
                )}
                <div>
                   <h4 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">{selectedItem.itemType}</h4>
                   <p className="text-[10px] text-neutral-500">{t('deal_desc')}</p>
                </div>
             </div>
             
             {/* Status Badge */}
             {(iConfirmed || otherConfirmed) && (
                 <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold rounded-lg">
                    {t('deal_status_pending')}
                 </div>
             )}
          </div>
          
          <div className="flex gap-4">
              {/* My Action Button */}
              {!iConfirmed ? (
                 <button 
                    onClick={() => handleDealAction(myRole === 'finder' ? 'handover' : 'receipt')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                       myRole === 'finder' 
                       ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-neutral-900/20' 
                       : 'bg-mint text-neutral-900 shadow-mint/20'
                    }`}
                 >
                    {myRole === 'finder' ? t('deal_btn_handover') : t('deal_btn_receive')}
                 </button>
              ) : (
                 <div className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-not-allowed flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {t('status_approved')}
                 </div>
              )}

              {/* Reject / Cancel Button */}
              <button 
                onClick={() => handleDealAction('cancel')}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                 {iConfirmed ? t('btn_cancel') : t('btn_reject')}
              </button>
          </div>
          
          <p className="text-[10px] text-center mt-3 text-neutral-400">
             {myRole === 'finder' ? t('deal_info_finder') : t('deal_info_loser')}
          </p>
       </div>
    );
  };

  const formatTime = (dateString, isFullDate = false) => {
    const date = new Date(dateString);
    if (isFullDate) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] flex flex-col lg:flex-row bg-white dark:bg-black lg:rounded-[2.5rem] lg:border border-neutral-200 dark:border-neutral-800 lg:shadow-2xl overflow-hidden relative">
      
      {/* List Panel - Hidden on mobile if chat is active */}
      <AnimatePresence initial={false} mode="popLayout">
         { (mobileView === 'list' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.div 
               {...transitionProps}
               className={`w-full lg:w-96 border-r border-neutral-100 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 absolute lg:static inset-0 z-10 lg:z-auto`}
            >
              {/* Header */}
              <div className="p-4 pt-6 md:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl sticky top-0 z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">{t('messages_title')}</h2>
                   <Link href="/desktop/profile">
                     <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 overflow-hidden">
                        {session?.user?.image ? <img src={session.user.image} className="w-full h-full object-cover"/> : <span>👤</span>}
                     </div>
                   </Link>
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder={t('search_placeholder')} 
                    className="w-full h-10 pl-9 pr-4 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm font-semibold dark:text-white focus:ring-2 focus:ring-mint transition-all outline-none placeholder-neutral-400" 
                  />
                  <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                {conversations.length === 0 && !loading && (
                  <div className="text-center py-20 px-8 opacity-60">
                      <div className="text-4xl mb-2 grayscale">📭</div>
                      <p className="text-sm font-bold">{t('no_messages_title')}</p>
                  </div>
                )}
                
                {conversations.map((conv) => (
                  <motion.div 
                    key={conv._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setSelectedUser({ _id: conv.user._id, ...conv.user });
                      if (conv.lastMessage.item) setSelectedItem(conv.lastMessage.item);
                      fetchMessages(conv.user._id);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden active:scale-95 ${
                      selectedUser?._id === conv.user._id 
                        ? 'bg-mint text-neutral-900' 
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.name}`} alt="" className="w-12 h-12 rounded-full bg-white object-cover shadow-sm" />
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow ring-2 ring-white">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`font-bold truncate text-sm ${selectedUser?._id === conv.user._id ? 'text-neutral-900' : 'text-neutral-900 dark:text-white'}`}>
                            {conv.user.role === 'admin' ? t('admin_support_name') : conv.user.name}
                            {conv.user.role === 'admin' && <span className="ml-1 text-[10px] bg-mint px-1 rounded text-neutral-900">{t('admin_badge')}</span>}
                        </h4>
                        <span className="text-[10px] opacity-60 font-medium">{formatTime(conv.lastMessage.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate font-medium ${
                        selectedUser?._id === conv.user._id ? 'text-neutral-800' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                         {conv.lastMessage.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence initial={false} mode="popLayout">
         { (mobileView === 'chat' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.div 
               {...transitionProps}
               className={`flex-1 flex flex-col bg-[#e5ddd5] dark:bg-[#0b0b0b] relative z-0 absolute lg:static inset-0`}
            >
               {/* Pattern Background */}
               <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://web.telegram.org/img/bg_0.png')] bg-repeat"></div>

              {selectedUser ? (
                <>
                  {/* Native Header */}
                  <div className="h-16 px-4 flex items-center justify-between bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm z-20 sticky top-0 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSelectedUser(null); setMobileView('list'); }} 
                          className="lg:hidden -ml-2 p-2 rounded-full text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <img src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} alt="" className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 object-cover border border-neutral-200 dark:border-neutral-700" />
                            <div className="flex flex-col">
                              <h3 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight">{selectedUser.name}</h3>
                              <p className="text-[10px] text-mint font-bold uppercase tracking-wider">{isTyping ? t('typing_status') : t('online_status')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <button className="p-2 rounded-full text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </div>

                  {/* Deal Panel */}
                  <DealPanel />

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10">
                    {messages.map((msg, index) => {
                      const isMe = msg.sender._id === session?.user?.id || msg.sender === session?.user?.id;
                      const nextMsg = messages[index + 1];
                      const isLastInGroup = !nextMsg || nextMsg.sender._id !== msg.sender._id;
                      
                      return (
                        <div 
                          key={msg._id || index} 
                          className={`flex chat-message ${isMe ? 'justify-end' : 'justify-start ml-2'}`}
                        >
                          <div className={`max-w-[75%] px-4 py-2 text-[15px] leading-relaxed relative shadow-sm ${
                            isMe 
                            ? `bg-mint text-neutral-900 rounded-2xl rounded-tr-sm ${isLastInGroup ? 'rounded-tr-sm' : 'rounded-tr-2xl'}` 
                            : `bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl rounded-tl-sm`
                          }`}>
                            {msg.content}
                            <span className={`text-[9px] float-right mt-1.5 ml-3 opacity-60 font-medium ${isMe ? 'text-neutral-900' : 'text-neutral-500'}`}>
                              {formatTime(msg.createdAt, true)}
                              {isMe && <span className="ml-1">✓</span>}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex justify-start ml-2">
                         <div className="bg-white dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                         </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>

                  {/* Input Area */}
                  <div className="bg-white dark:bg-neutral-900 px-3 py-2 border-t border-neutral-100 dark:border-neutral-800 safe-area-pb lg:m-4 lg:rounded-2xl lg:shadow-lg lg:border-none z-20">
                     <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <button type="button" className="p-3 text-neutral-400 hover:text-neutral-600 transition-colors hidden sm:block">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        
                        <input 
                              type="text" 
                              value={messageInput}
                              onChange={handleInputChange}
                              placeholder={t('message_input_placeholder')} 
                              className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-mint transition-all"
                        />
                        
                        <button 
                           type="submit" 
                           disabled={!messageInput.trim()} 
                           className="p-3 bg-mint text-neutral-900 rounded-xl shadow-lg shadow-mint/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                           <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                     </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-10 bg-neutral-50 dark:bg-neutral-950">
                   <div className="w-24 h-24 bg-white dark:bg-neutral-900 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-xl animate-bounce">💬</div>
                   <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">{t('select_conversation_title')}</h3>
                   <p className="text-neutral-400 font-medium text-xs max-w-xs mx-auto mt-2">{t('select_conversation_desc')}</p>
                </div>
              )}
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
