"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { getApiUrl } from "@/lib/api-config";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationCenter from "./NotificationCenter";
import { useLanguage } from "../../context/LanguageContext";

export default function TopHeader({ compact = false }) {
  const { data: session, update } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [headerProfile, setHeaderProfile] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    if (session?.user?.accessToken) {
      const fetchUnreadMessages = async () => {
        try {
          const res = await fetch(getApiUrl("messages/unread-count"), {
            headers: { "Authorization": `Bearer ${session.user.accessToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadMessagesCount(data.count);
          }
        } catch (error) {
          console.error("Error fetching unread messages count:", error);
        }
      };

      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [session]);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  // Admin Reply State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Chat Popover State
  const [conversations, setConversations] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (showMessages && session?.user?.accessToken) {
        setMessagesLoading(true);
        fetch(getApiUrl("messages"), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        })
        .then(res => res.json())
        .then(data => setConversations(data.slice(0, 5))) 
        .catch(err => console.error(err))
        .finally(() => setMessagesLoading(false));
    }
  }, [showMessages, session]);

  const handleReplyOpen = (senderId) => {
    setSelectedSenderId(senderId);
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      const res = await fetch(getApiUrl('admin/reply-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({ userId: selectedSenderId, message: replyMessage })
      });

      if (res.ok) {
        alert(t("reply_sent"));
        setReplyModalOpen(false);
        setReplyMessage("");
        setSelectedSenderId(null);
      } else {
        alert(t("error_generic") || "Xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert(t("error_generic") || "Xatolik yuz berdi");
    }
  };

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        phone: session.user.phone || "",
      });
    }
  }, [session]);

  useEffect(() => {
    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      setHeaderProfile(null);
      return;
    }

    const controller = new AbortController();
    const fetchHeaderProfile = async () => {
      try {
        const response = await fetch(getApiUrl("users/me"), {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Profile request failed (${response.status})`);
        }

        const profile = await response.json();
        setHeaderProfile(profile);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Header profile fetch error:", error);
        }
      }
    };

    fetchHeaderProfile();
    return () => controller.abort();
  }, [session?.user?.accessToken]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (!session?.user?.accessToken) {
        throw new Error("Tizimga qayta kirishingiz kerak");
      }

      const res = await fetch(getApiUrl("user/update"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("error_update_profile") || "Profilni yangilashda xatolik yuz berdi");
      }

      // Sessiyani yangilash (Frontendda o'zgarish darhol ko'rinishi uchun)
      await update({
        ...session,
        user: {
          ...session.user,
          name: formData.name,
          phone: formData.phone,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* Update handleSearch to use /desktop */
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (search.trim()) {
        router.push(`/desktop?q=${encodeURIComponent(search)}`);
      } else {
        router.push("/desktop");
      }
    }
  };

  const userName =
    headerProfile?.name ||
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    t("default_user_name");
  
  const rawImage =
    headerProfile?.avatar ||
    session?.user?.avatar ||
    session?.user?.image;
  const userImage = rawImage 
    ? (rawImage.startsWith('http') ? rawImage : `${getApiUrl('').replace('/api', '')}${rawImage}`)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;

  return (
    <header className={`sticky top-0 z-[1100] transition-colors duration-300 ${compact ? "h-[42px]" : "h-[52px]"}`}>
      <div className="absolute inset-0 border-b border-[#e5e5e5] bg-[#fafafa]/95 backdrop-blur-md" />
      <div className={`relative flex h-full items-center ${compact ? "gap-3 px-5" : "gap-3 px-4"}`}>
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 z-50 bg-white dark:bg-neutral-900 flex items-center px-4 gap-3 sm:hidden border-b border-neutral-200 dark:border-neutral-800"
          >
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                autoFocus
                placeholder={t("mobile_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(e);
                    setShowMobileSearch(false);
                  }
                }}
                className="w-full h-10 pl-10 pr-4 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-mint outline-none dark:text-white"
              />
            </div>
            <button onClick={() => setShowMobileSearch(false)} className="text-sm font-bold text-neutral-500 dark:text-neutral-400">{t("cancel")}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {compact && (
        <Link href="/desktop" className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#555] transition hover:text-[#171717]" aria-label="E’lonlar sahifasiga qaytish">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h12" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Ortga
        </Link>
      )}

      {/* Mobile Logo & Brand */}
      <div className={`items-center gap-2 md:hidden ${compact ? "hidden" : "flex"}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-mint to-[#8bb3a9] rounded-lg flex items-center justify-center text-neutral-800 shadow-lg shadow-mint/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <span className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">QaytarMe</span>
      </div>

      {/* Search - Hidden on very small screens, responsive on larger ones */}
      <div className={`hidden min-w-0 items-center sm:flex ${compact ? "flex-1 justify-end gap-2" : "flex-1 gap-3"}`}>
        <div className={`relative group min-w-0 ${compact ? "w-full max-w-[160px]" : "w-full flex-1"}`}>
          <button 
            onClick={() => search.trim() && router.push(`/desktop?q=${encodeURIComponent(search)}`)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-mint transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className={`w-full border border-[#e1e1e1] bg-white text-xs text-[#333] placeholder:text-[#888] rounded-lg focus:border-[#999] focus:ring-2 focus:ring-[#777]/10 transition-all outline-none ${compact ? "h-7 pl-8 pr-3" : "h-10 pl-10 pr-4"}`}
          />
        </div>
        {!compact && <Link
          href="/desktop/map"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#e1e1e1] bg-white px-3 text-[11px] font-semibold text-[#333] transition hover:bg-[#f1f1f1]"
          aria-label="Barcha hududlardagi e'lonlarni xaritada ko'rish"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Barcha hududlar
          <svg className="h-3.5 w-3.5 text-[#777]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>}
      </div>

      {/* Right Actions */}
      <div className={`ml-auto flex shrink-0 items-center ${compact ? "gap-1.5" : "gap-2"}`}>
        <button 
          onClick={() => setShowMobileSearch(true)}
          className="sm:hidden w-10 h-10 flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Chat Popover */}
        <div className="relative hidden">
          <button 
            onClick={() => setShowMessages(!showMessages)}
            className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-white/50 dark:bg-neutral-800/50 rounded-xl hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            title="Xabarlar"
          >
            <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-ivory dark:border-neutral-900 shadow-sm flex items-center justify-center animate-bounce">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showMessages && (
              <>
                 <div className="fixed inset-0 z-40" onClick={() => setShowMessages(false)} />
                 <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-4 z-50 overflow-hidden"
                 >
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white mb-3 uppercase tracking-wider">{t("messages_title")}</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                       {messagesLoading ? (
                          <div className="p-4 text-center text-xs text-neutral-500 animate-pulse">{t("loading")}</div>
                       ) : conversations.length > 0 ? (
                          conversations.map((conv) => (
                            <Link 
                               key={conv._id} 
                               href={`/desktop/messages?userId=${conv.user._id}`}
                               onClick={() => setShowMessages(false)}
                               className="flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                            >
                               <div className="relative shrink-0">
                                  <img src={conv.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.user.name}`} className="w-10 h-10 rounded-full object-cover bg-neutral-100" />
                                  {conv.unreadCount > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900"/>}
                               </div>
                               <div className="overflow-hidden flex-1">
                                  <h4 className={`text-xs font-bold truncate ${conv.unreadCount > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{conv.user.name}</h4>
                                  <p className={`text-[10px] truncate ${conv.unreadCount > 0 ? 'font-bold text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>{conv.lastMessage.content}</p>
                               </div>
                               <span className="text-[9px] text-neutral-400 whitespace-nowrap">
                                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </span>
                            </Link>
                          ))
                       ) : (
                           <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                               <div className="text-2xl mb-2">💬</div>
                               <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t("no_messages_yet")}</p>
                           </div>
                       )}
                    </div>
                    <Link 
                      href="/desktop/messages" 
                      onClick={() => setShowMessages(false)}
                      className="block w-full mt-3 py-2 text-center text-[10px] font-black text-mint uppercase tracking-widest hover:underline"
                    >
                      Barcha xabarlarni ko'rish
                    </Link>
                 </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <NotificationCenter
          compact={compact}
          onAdminReply={
            session?.user?.role === "admin" ? handleReplyOpen : undefined
          }
        />

        {/* Desktop Profile */}
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={() => setShowProfile(true)} className="text-left">
            <div className="flex cursor-pointer items-center gap-2 pl-1 group">
              <div className={`text-right ${compact ? "hidden" : "hidden md:block"}`}>
                <h4 className="max-w-[150px] truncate text-xs font-semibold text-[#333]">{userName}</h4>
              </div>
              <div className={`overflow-hidden rounded-full border border-[#dedede] bg-[#e5e5e5] transition group-hover:border-[#999] ${compact ? "h-7 w-7" : "h-9 w-9"}`}>
                 <img src={userImage} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <svg className="h-3.5 w-3.5 text-[#666]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>

        {/* Mobile Menu Button & Popover */}
        <div className="md:hidden relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMenu(false)}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1200]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-neutral-900 shadow-2xl z-[1210] flex flex-col overflow-hidden border-l border-neutral-100 dark:border-neutral-800"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white">{t("menu_title")}</h3>
                    <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                      <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <Link href="/desktop/profile" onClick={() => setShowMenu(false)} className="w-full text-left">
                    <div className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors mb-2">
                      <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{userName}</h4>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{t("manage_profile")}</p>
                      </div>
                    </div>
                  </Link>


                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                  <button 
                    onClick={() => toggleTheme()}
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors text-neutral-700 dark:text-neutral-300"
                  >
                    <div className="flex items-center gap-3">
                      {isDarkMode ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      )}
                      <span className="text-sm font-bold">{isDarkMode ? t("theme_light") : t("theme_dark")}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-mint' : 'bg-neutral-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} />
                    </div>
                  </button>

                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors text-red-500 mt-2 border border-red-500/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="text-sm font-black uppercase tracking-widest">{t("logout")}</span>
                  </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Drawer (Right Side) */}
        <AnimatePresence>
          {showProfile && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-4 z-50 overflow-hidden"
                >
                   <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-black text-sm text-neutral-900 dark:text-white uppercase tracking-wider">{t("profile_settings")}</h3>
                   </div>
                   
                   <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                         <div className="w-12 h-12 rounded-xl bg-mint p-0.5 overflow-hidden shrink-0">
                            <img src={userImage} alt="Profile" className="w-full h-full object-cover rounded-[0.5rem]" />
                         </div>
                         <div className="min-w-0">
                            <h2 className="text-sm font-black text-neutral-900 dark:text-white truncate">{userName}</h2>
                            <p className="text-[10px] text-neutral-500 truncate">{session?.user?.email}</p>
                         </div>
                      </div>

                      <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{t("select_language")}</span>
                        <LanguageSwitcher />
                      </div>

                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <span>{isDarkMode ? t("theme_light") : t("theme_dark")}</span>
                        <span aria-hidden="true">{isDarkMode ? "☼" : "◐"}</span>
                      </button>

                      {/* Quick Links */}
                      <div>
                         <Link href="/desktop/profile" onClick={() => setShowProfile(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                            <span className="text-base group-hover:scale-110 transition-transform">👤</span>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white">{t("detailed_profile")}</span>
                         </Link>
                      </div>

                      <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                      {/* Logout */}
                      <button 
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {t("logout")}
                      </button>
                   </div>
                </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Reply Modal */}
        <AnimatePresence>
            {replyModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1300]" onClick={() => setReplyModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2rem] p-8 shadow-2xl z-[1310] border border-neutral-100 dark:border-neutral-800"
                    >
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-6">{t("reply_modal_title")}</h3>
                        <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={t("reply_placeholder")}
                            className="w-full h-32 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-sm outline-none border border-transparent focus:border-mint transition-colors resize-none mb-6 dark:text-white"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setReplyModalOpen(false)}
                                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                {t("cancel")}
                            </button>
                            <button 
                                onClick={handleSendReply}
                                className="px-6 py-3 rounded-xl bg-mint text-neutral-900 text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-mint/20"
                            >
                                {t("send")}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  );
}
