"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, lang, changeLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState(pathname);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [mounted, setMounted] = useState(false);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  // Handle mounting to fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (session?.user?.id) {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
     try {
        // Mock notifications for now or real API call
        // const res = await fetch(`${getApiUrl()}/notifications/my?userId=${session.user.id}`);
        // const data = await res.json();
        
        // Mock data
        const mockData = [
           { _id: '1', message: 'Sizning e\'loningiz "iPhone 13" tasdiqlandi', read: false, type: 'like', createdAt: new Date().toISOString() },
           { _id: '2', message: 'Yangi xabar: Admin', read: true, type: 'admin_message', createdAt: new Date(Date.now() - 3600000).toISOString() }
        ];
        
        setNotifications(mockData);
        setUnreadCount(mockData.filter(n => !n.read).length);
     } catch (err) {
        console.error("Error fetching notifications:", err);
     }
  };

  const markAllAsRead = async () => {
      // API call to mark all as read
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
  };

  const handleSearch = (e) => {
      if (e.key === 'Enter') {
          console.log("Searching for:", searchQuery);
          // Redirect to search results or filter
          setShowSearch(false);
      }
  };

  const userImage = session?.user?.image || session?.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || 'User'}`;

  // Prevent hydration mismatch
  if (!mounted) {
      return <div className="min-h-screen bg-neutral-50 dark:bg-black" />;
  }

  return (
    <div className={`min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white pb-24 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- Top Navbar --- */}
      <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/50 dark:border-white/5 px-4 flex items-center justify-between transition-all">
         
         {/* Search Overlay */}
         <AnimatePresence>
            {showSearch && (
               <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '100%' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="absolute inset-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl flex items-center px-4 gap-3 border-b border-neutral-200 dark:border-white/5 overflow-hidden"
               >
                  <div className="relative flex-1 group">
                     <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-mint transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input 
                        autoFocus
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder={t('mobile_search_placeholder') || "Qidirish..."}
                        className="w-full h-9 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-lg pl-9 pr-3 text-xs font-medium outline-none focus:ring-1 focus:ring-mint/50 focus:bg-white dark:focus:bg-black transition-all dark:text-white placeholder:text-neutral-500"
                     />
                  </div>
                  <button 
                     onClick={() => setShowSearch(false)} 
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 active:scale-90 transition-all font-bold text-xs"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Logo */}
         <Link href="/mobile" className="flex items-center gap-2 active:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-gradient-to-br from-mint to-[#81B9AC] rounded-lg flex items-center justify-center text-secondary shadow-md shadow-mint/20">
               <svg className="w-4 h-4 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <span className="font-black text-lg tracking-tight text-neutral-900 dark:text-white">QaytarMe</span>
         </Link>

         {/* Right Actions */}
         <div className="flex items-center gap-1">
            {/* Search Toggle */}
            <button 
               onClick={() => setShowSearch(true)}
               className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-95"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* Notifications */}
            <div className="relative">
               <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors relative active:scale-95 ${showNotifications ? 'bg-neutral-100 dark:bg-neutral-800 text-mint' : ''}`}
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-neutral-900 ring-1 ring-white dark:ring-neutral-900" />
                  )}
               </button>

               <AnimatePresence>
                  {showNotifications && (
                     <>
                        <div 
                           className="fixed inset-0 w-screen h-screen z-40 bg-black/10 backdrop-blur-[2px] cursor-default" 
                           onClick={(e) => {
                              e.stopPropagation();
                              setShowNotifications(false);
                           }} 
                        />
                        <motion.div
                           initial={{ opacity: 0, y: -20, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: -20, scale: 0.95 }}
                           transition={{ type: "spring", stiffness: 300, damping: 25 }}
                           className="fixed top-[56px] right-2 left-2 sm:left-auto sm:w-80 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-neutral-200/50 dark:border-white/10 overflow-hidden"
                        >
                           <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/5">
                              <h3 className="font-bold text-xs dark:text-white flex items-center gap-2">
                                 {t("notifications") || "Bildirishnomalar"}
                                 {unreadCount > 0 && <span className="bg-mint text-neutral-900 text-[9px] font-black px-1.5 py-0.5 rounded-md">{unreadCount}</span>}
                              </h3>
                              {unreadCount > 0 && (
                                 <button onClick={markAllAsRead} className="text-[9px] font-bold text-mint hover:underline">
                                    {t("mark_all_read") || "O'qilgan qilish"}
                                 </button>
                              )}
                           </div>
                           
                           <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden">
                              {notificationsLoading ? (
                                 <div className="flex justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-mint border-t-transparent rounded-full animate-spin"/>
                                 </div>
                              ) : notifications.length > 0 ? (
                                 <div className="divide-y divide-neutral-100 dark:divide-white/5">
                                    {notifications.map((n) => (
                                       <div key={n._id} className={`p-3 flex gap-3 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-mint/5 dark:bg-mint/5' : ''}`}>
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-neutral-100 dark:border-white/5 ${!n.read ? 'bg-mint/10 text-mint' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400'}`}>
                                              {/* Icons based on type */}
                                              {n.type === 'like' && (
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                              )}
                                              {n.type === 'friend_request' && (
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                              )}
                                              {n.type === 'new-ariza' && (
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                              )}
                                              {n.type === 'admin_message' && (
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                              )}
                                              {/* Default/Other */}
                                              {!['like', 'friend_request', 'new-ariza', 'admin_message'].includes(n.type) && (
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                              )}
                                           </div>
                                           <div className="flex-1 min-w-0">
                                              <p className={`text-[11px] leading-snug ${!n.read ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-600 dark:text-neutral-400'}`}>
                                                 {n.message}
                                              </p>
                                              <span className="text-[9px] text-neutral-400 mt-0.5 block">
                                                 {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                           </div>
                                           {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-mint mt-1.5 shrink-0" />}
                                        </div>
                                     ))}
                                  </div>
                              ) : (
                                 <div className="py-8 flex flex-col items-center text-center text-neutral-400">
                                    <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    <p className="text-[10px] font-medium">{t("no_notifications") || "Yangi xabarlar yo'q"}</p>
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     </>
                  )}
               </AnimatePresence>
            </div>
            
            {/* Telegram Bot Link */}
            <button 
               onClick={() => window.open('https://t.me/qaytarme_app_bot', '_blank')}
               className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#0088cc]/10 text-[#0088cc] transition-colors active:scale-95"
               title="Dasturimiz siz uchun qulay"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
               </svg>
            </button>

            {/* Profile Menu Trigger */}
            <div className="relative">
               <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-95"
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </button>
             </div>
          </div>
       </header>

      {/* Main Content */}
      <main className="pt-16 px-4 pb-20">
        {children}
      </main>

      {/* --- Bottom Navigation (Standard) --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-neutral-100 dark:border-white/5 pb-6 pt-3 px-6 flex items-end justify-between transition-all select-none">
         {[
           { path: "/mobile", label: "Asosiy", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097v9.403a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z"/></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
           { path: "/mobile/messages", label: "Message", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-5.02-1.35L2 22l1.35-4.98A9.96 9.96 0 0 1 2 12Z" /></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
           { path: "/mobile/matches", label: "Mos", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M10.198 1.978a.75.75 0 0 1 .792.09l9.5 7.75a.75.75 0 0 1 .15.99l-5.5 8.5a.75.75 0 0 1-1.22-.05l-2.67-4.22-2.14 4.14a.75.75 0 0 1-1.296-.06l-4.5-9.5a.75.75 0 0 1 .314-1.02l6.57-2.62Z" /></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
           { path: "/mobile/add", label: "Qo'shish", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm1 5a1 1 0 1 0-2 0v4H7a1 1 0 1 0 0 2h4v4a1 1 0 1 0 2 0v-4h4a1 1 0 1 0 0-2h-4V7Z" /></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg> },
           { path: "/mobile/map", label: "Xarita", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.589 2 4 5.589 4 9.995 3.971 16.44 11.696 21.784 12 22c0 0 8.029-5.56 8-12 0-4.411-3.589-8-8-8Zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Z" /></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
           { path: "/mobile/profile", label: "Profil", icon: (active) => active ? <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm9 11v-1a6 6 0 0 0-6-6H9a6 6 0 0 0-6 6v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1Z" /></svg> : <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
         ].map((item, idx) => {
             const isActive = activeTab === item.path || activeTab.startsWith(item.path + "/");
             
             return (
               <Link 
                  key={idx} 
                  href={item.path} 
                  className={`flex flex-col items-center justify-end transition-colors w-14 pb-1 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400'}`}
               >
                  {item.icon(isActive)}
                  <span className="text-[10px] font-bold tracking-tight leading-none">{item.label}</span>
               </Link>
             );
         })}
      </nav>

      {/* --- Profile Side Drawer (Moved Outside) --- */}
      <AnimatePresence>
         {showProfileMenu && (
            <>
               {/* Overlay */}
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 w-screen h-screen z-[60] bg-black/40 backdrop-blur-sm cursor-default" 
                  onClick={(e) => {
                     e.stopPropagation();
                     setShowProfileMenu(false);
                  }} 
               />
               
               {/* Side Drawer (Telegram Style) */}
               <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: "0%" }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed inset-y-0 right-0 z-[70] w-72 bg-white dark:bg-[#1c1c1d] flex flex-col shadow-2xl"
               >
                   {/* Drawer Header */}
                   <div className="bg-[#f0f2f5] dark:bg-[#212121] p-5 pt-8 flex flex-col relative">
                       {/* Theme Toggle (Top Right) */}
                       <button 
                         onClick={toggleTheme} 
                         className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-blue-500 dark:text-neutral-400 dark:hover:text-white transition-colors"
                       >
                            {isDarkMode ? (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            ) : (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            )}
                       </button>

                       {/* Avatar */}
                       <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-neutral-200 dark:border-white/10 shadow-sm">
                           <img src={userImage} className="w-full h-full object-cover" />
                       </div>
                       
                       {/* User Info */}
                       <div>
                           <h4 className="font-bold text-base text-neutral-900 dark:text-white leading-tight">{session?.user?.name}</h4>
                           <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{session?.user?.phone || session?.user?.email}</p>
                       </div>
                   </div>

                   {/* Menu Items */}
                   <div className="flex-1 overflow-y-auto py-2">
                       <div className="space-y-0.5">
                          
                          {/* My Items */}
                          <Link href="/mobile/my-items" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                             <svg className="w-6 h-6 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             <span className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("my_items") || "Mening e'lonlarim"}</span>
                          </Link>

                          {/* Settings */}
                          <Link href="/mobile/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                             <svg className="w-6 h-6 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("profile_settings") || "Sozlamalar"}</span>
                          </Link>

                          {/* Language Selection */}
                          <div className="px-5 py-2">
                             <div className="text-xs font-bold text-blue-500 uppercase mb-2 ml-1">{t("select_language")}</div>
                             <div className="flex flex-wrap gap-2">
                                {[
                                  { code: 'uz', label: 'UZ' },
                                  { code: 'ru', label: 'RU' },
                                  { code: 'en', label: 'EN' },
                                ].map((l) => (
                                  <button
                                     key={l.code}
                                     onClick={() => changeLanguage(l.code)}
                                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        lang === l.code
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                     }`}
                                  >
                                     {l.label}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="h-px bg-neutral-200 dark:bg-white/5 my-2 mx-5" />

                          {/* Contact Admin */}
                          <Link href="/mobile/contact" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                             <svg className="w-6 h-6 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                             <span className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("contact_admin") || "Admin bilan bog'lanish"}</span>
                          </Link>

                          {/* About Us */}
                          <Link href="/mobile/about" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                             <svg className="w-6 h-6 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <span className="text-[15px] font-medium text-neutral-900 dark:text-white">{t("about_us") || "Dastur haqida"}</span>
                          </Link>

                          {/* Donate Card */}
                          <div className="p-4 mx-4 mb-4 bg-[#fffff0] dark:bg-neutral-800 rounded-2xl border border-mint/20 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-mint/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                              <h4 className="text-neutral-800 dark:text-white text-xs font-bold mb-1 uppercase tracking-tighter relative z-10">Loyihani qo'llab-quvvatlang</h4>
                              <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mb-3 relative z-10">Bizning rivojlanishimizga hissa qo'shing</p>
                              <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-neutral-100 dark:border-white/5 mb-2 relative z-10">
                                   <p className="text-[10px] font-mono text-center font-bold text-neutral-600 dark:text-neutral-300 tracking-wider">9860 3501 4233 7368</p>
                              </div>
                              <button 
                                 onClick={() => {
                                     navigator.clipboard.writeText("9860350142337368");
                                     alert("Karta raqami nusxalandi!");
                                 }}
                                 className="w-full py-2 bg-mint text-neutral-800 text-[10px] font-bold rounded-lg hover:brightness-95 transition-all shadow-sm flex items-center justify-center gap-2 relative z-10"
                              >
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                 Karta raqamidan nusxa olish
                              </button>
                          </div>
                       </div>
                   </div>

                   {/* Footer: App Version and Logout */}
                    <div className="p-4 border-t border-neutral-100 dark:border-white/5 bg-[#f0f2f5] dark:bg-[#212121]">
                       <button 
                         onClick={() => {
                            const { signOut } = require("next-auth/react");
                            signOut({ callbackUrl: "/login" });
                         }} 
                         className="flex items-center gap-4 px-2 py-2 hover:opacity-70 transition-opacity w-full text-left mb-2"
                       >
                          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          <span className="text-[15px] font-medium text-red-500">{t("logout") || "Chiqish"}</span>
                       </button>
                       <div className="text-center text-[10px] text-neutral-400 font-medium">QaytarMe v2.0 - Beta</div>
                    </div>

               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
