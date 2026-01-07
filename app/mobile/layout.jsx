"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "@/lib/api-config";

export default function MobileLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isDarkMode } = useTheme();
  const { t, lang, changeLanguage } = useLanguage();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchNotifications();
      fetchUnreadMessages();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadMessages();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

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
      console.error("Error fetching unread messages:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!session?.user?.accessToken) return;
    
    setNotificationsLoading(true);
    try {
      const res = await fetch(getApiUrl("users/notifications"), {
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications((data.notifications || []).reverse());
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Notifications fetch error:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await fetch(getApiUrl("users/notifications/read-all"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
       if (searchQuery.trim()) {
          router.push(`/mobile/search?q=${encodeURIComponent(searchQuery)}`);
          setShowSearch(false);
       }
    }
  };

  // Profile Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { toggleTheme } = useTheme();

  const handleLogout = () => {
    const { signOut } = require("next-auth/react"); 
    signOut({ callbackUrl: "/login" });
  };
  


  // Bottom Navigation Items
  const navItems = [
    { 
      id: 'home', 
      label: t('nav_home'), 
      path: '/mobile',
      icon: (active) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
    { 
      id: 'map', 
      label: t('nav_map'), 
      path: '/mobile/map',
      icon: (active) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    },
    { 
      id: 'add', 
      label: '', 
      path: '/mobile/add', 
      isMain: true,
      icon: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
    },
    { 
      id: 'matches', 
      label: t('nav_matches'), 
      path: '/mobile/matches',
      icon: (active) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    { 
      id: 'chat', 
      label: t('nav_messages'), 
      path: '/mobile/messages',
      icon: (active) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    },
  ];

  const userImage = session?.user?.image || session?.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || 'User'}`;

  return (
    <div className={`min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white pb-24 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- Top Navbar --- */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 px-4 flex items-center justify-between">
         
         {/* Search Overlay & Notifications Overlay (PREVIOUSLY ADDED) ... */}
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
                        className="w-full h-10 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl pl-10 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-mint/50 focus:bg-white dark:focus:bg-black transition-all dark:text-white placeholder:text-neutral-500"
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
            <div className="w-9 h-9 bg-gradient-to-br from-mint to-[#81B9AC] rounded-xl flex items-center justify-center text-secondary shadow-lg shadow-mint/20">
               <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <span className="font-black text-xl tracking-tight text-neutral-900 dark:text-white">QaytarMe</span>
         </Link>

         {/* Right Actions */}
         <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <button 
               onClick={() => setShowSearch(true)}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* Notifications */}
            <div className="relative">
               <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors relative ${showNotifications ? 'bg-neutral-100 dark:bg-neutral-800 text-mint' : ''}`}
               >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && (
                     <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-neutral-900 ring-2 ring-white dark:ring-neutral-900" />
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
                           className="fixed top-[70px] right-4 left-4 sm:left-auto sm:w-80 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-neutral-200/50 dark:border-white/10 overflow-hidden"
                        >
                           <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/5">
                              <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
                                 {t("notifications") || "Bildirishnomalar"}
                                 {unreadCount > 0 && <span className="bg-mint text-neutral-900 text-[10px] font-black px-1.5 py-0.5 rounded-md">{unreadCount}</span>}
                              </h3>
                              {unreadCount > 0 && (
                                 <button onClick={markAllAsRead} className="text-[10px] font-bold text-mint hover:underline">
                                    {t("mark_all_read") || "O'qilgan qilish"}
                                 </button>
                              )}
                           </div>
                           
                           <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                              {notificationsLoading ? (
                                 <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin"/>
                                 </div>
                              ) : notifications.length > 0 ? (
                                 <div className="divide-y divide-neutral-100 dark:divide-white/5">
                                    {notifications.map((n) => (
                                       <div key={n._id} className={`p-4 flex gap-3 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-mint/5 dark:bg-mint/5' : ''}`}>
                                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-neutral-100 dark:border-white/5 ${!n.read ? 'bg-mint/10 text-mint' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400'}`}>
                                              {/* Icons based on type */}
                                              {n.type === 'like' && (
                                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                              )}
                                              {n.type === 'friend_request' && (
                                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                              )}
                                              {n.type === 'new-ariza' && (
                                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                              )}
                                              {n.type === 'admin_message' && (
                                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                              )}
                                              {/* Default/Other */}
                                              {!['like', 'friend_request', 'new-ariza', 'admin_message'].includes(n.type) && (
                                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                              )}
                                           </div>
                                           <div className="flex-1 min-w-0">
                                              <p className={`text-xs leading-relaxed ${!n.read ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-600 dark:text-neutral-400'}`}>
                                                 {n.message}
                                              </p>
                                              <span className="text-[10px] text-neutral-400 mt-1 block">
                                                 {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                           </div>
                                           {!n.read && <div className="w-2 h-2 rounded-full bg-mint mt-2 shrink-0" />}
                                        </div>
                                     ))}
                                  </div>
                              ) : (
                                 <div className="py-12 flex flex-col items-center text-center text-neutral-400">
                                    <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    <p className="text-xs font-medium">{t("no_notifications") || "Yangi xabarlar yo'q"}</p>
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     </>
                  )}
               </AnimatePresence>
            </div>
            
            {/* Profile Menu Trigger */}
            <div className="relative">
               <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-neutral-200 dark:border-neutral-700 active:scale-95 transition-transform"
               >
                  <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
               </button>

               <AnimatePresence>
                  {showProfileMenu && (
                     <>
                        <div 
                           className="fixed inset-0 w-screen h-screen z-40 bg-black/20 backdrop-blur-sm cursor-default" 
                           onClick={(e) => {
                              e.stopPropagation();
                              setShowProfileMenu(false);
                           }} 
                        />
                        <motion.div
                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                           className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-2 z-50 overflow-hidden"
                        >
                            {/* User Header */}
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl mb-2 flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                   <img src={userImage} className="w-full h-full object-cover" />
                               </div>
                               <div className="min-w-0">
                                   <h4 className="font-bold text-sm truncate">{session?.user?.name}</h4>
                                   <p className="text-[10px] text-neutral-500 truncate">{session?.user?.email}</p>
                               </div>
                            </div>
                            
                            <div className="space-y-1">
                               {/* Dark Mode */}
                               <button 
                                 onClick={toggleTheme}
                                 className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors"
                               >
                                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                                     {isDarkMode ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                     ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                     )}
                                  </span>
                                  {isDarkMode ? t("theme_light") : t("theme_dark")}
                               </button>

                               {/* Language - Simple toggle for now or redirect */}
                               <div className="p-3">
                                  <div className="text-[10px] font-black uppercase text-neutral-400 mb-2 flex items-center gap-2">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.204 8.842l-2.244-2.793 2.244-2.793H9.796a4 4 0 00-3.21 1.706C5.586 9.47 5 11.53 5 14h12.368L16 11.082a4 4 0 00-1.04-2.24" /></svg>
                                     {t("select_language")}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                     {[
                                       { code: 'uz', label: 'UZ' },
                                       { code: 'ru', label: 'RU' },
                                       { code: 'en', label: 'EN' },
                                       { code: 'kk', label: 'KZ' },
                                       { code: 'ky', label: 'KG' },
                                       { code: 'kaa', label: 'QR' }
                                     ].map((l) => (
                                       <button
                                          key={l.code}
                                          onClick={() => changeLanguage(l.code)}
                                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-colors uppercase ${
                                             lang === l.code
                                             ? 'bg-mint text-neutral-900 shadow-sm'
                                             : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                          }`}
                                       >
                                          {l.label}
                                       </button>
                                     ))}
                                  </div>
                               </div>

                               <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                               {/* My Items */}
                               <Link href="/mobile/my-items" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors">
                                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                  </span>
                                  {t("my_items") || "Mening e'lonlarim"}
                               </Link>
                               
                               {/* Settings */}
                               <Link href="/mobile/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors">
                                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  </span>
                                  {t("profile_settings") || "Sozlamalar"}
                               </Link>

                               {/* Contact Admin */}
                               <Link href="/mobile/contact" onClick={() => setShowProfileMenu(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors">
                                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                  </span>
                                  {t("contact_admin") || "Admin bilan bog'lanish"}
                               </Link>

                               {/* About Us */}
                               <Link href="/mobile/about" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors">
                                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </span>
                                  {t("about_us") || "Biz haqimizda"}
                               </Link>

                               <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                               {/* Logout */}
                               <button 
                                 onClick={() => {
                                    const { signOut } = require("next-auth/react");
                                    signOut({ callbackUrl: "/login" });
                                 }} 
                                 className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 text-xs font-bold transition-colors"
                               >
                                  <span className="text-lg">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                  </span>
                                  {t("logout") || "Chiqish"}
                               </button>
                            </div>
                        </motion.div>
                     </>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </header>



      {/* --- Main Content --- */}
      <main className="pt-20 px-4">
         {children}
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-white/5 px-4 pb-safe pb-2 pt-2">
         <div className="grid grid-cols-5 items-end max-w-md mx-auto relative">
            {navItems.map((item) => {
               const isActive = pathname === item.path;
               
               if (item.isMain) {
                  return (
                     <div key={item.id} className="flex justify-center relative">
                        <Link 
                           href={item.path}
                           className="relative -top-6 group"
                        >
                           <div className="w-14 h-14 rounded-2xl bg-mint text-neutral-900 flex items-center justify-center text-2xl shadow-xl shadow-mint/40 border-4 border-neutral-50 dark:border-black transform transition-all group-active:scale-95 group-active:rotate-90">
                              {item.icon(isActive)}
                           </div>
                        </Link>
                     </div>
                  );
               }

               return (
                  <Link 
                     key={item.id} 
                     href={item.path}
                     className={`relative flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-mint' : 'text-neutral-400 dark:text-neutral-500'}`}
                  >
                     <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon(isActive)}</span>
                     <span className="text-[9px] font-bold uppercase tracking-wide truncate w-full text-center">{item.label}</span>
                     {isActive && <span className="absolute -bottom-2 w-1 h-1 bg-mint rounded-full" />}
                     
                     {/* Chat Unread Badge */}
                     {item.id === 'chat' && unreadMessagesCount > 0 && (
                        <span className="absolute top-1 right-1/4 translate-x-1/2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 shadow-sm z-10">
                           {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                        </span>
                     )}
                  </Link>
               );
            })}
         </div>
      </nav>
    </div>
  );
}
