"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "../../context/ThemeContext";
import { getApiUrl } from "@/lib/api-config";

const adminMenuItems = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "E'lonlar", href: "/admin/items", icon: "📦" },
  { name: "Foydalanuvchilar", href: "/admin/users", icon: "👥" },
  { name: "Xabarlar", href: "/admin/messages", icon: "💬" },
  { name: "Sahifalar", href: "/desktop/about", icon: "📑" },
  { name: "Statistika", href: "/admin/stats", icon: "📈" },
  { name: "Sozlamalar", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const fetchNotifications = async () => {
    if (session?.user?.accessToken) {
      try {
        const res = await fetch(getApiUrl("admin/notifications"), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter only unread or recent messages if needed, or show all
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  };

  React.useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
      // Poll for new notifications
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return "Hozirgina";
    if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa avval`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat avval`;
    return `${Math.floor(diff / 86400)} kun avval`;
  };

  React.useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "admin")) {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-ivory">
        <div className="w-10 h-10 border-4 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-ivory dark:bg-neutral-950 flex transition-colors duration-300">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-neutral-900 dark:bg-black text-white flex flex-col fixed h-screen z-50 border-r border-white/5">
        <div className="p-8">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center text-neutral-800 shadow-lg shadow-mint/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight">QaytarMe</span>
              <span className="text-[10px] text-mint font-bold uppercase tracking-[0.2em]">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? "bg-mint text-neutral-900 shadow-lg shadow-mint/20"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold text-sm tracking-wide">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <Link href="/mainpage">
            <button className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-bold rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Asosiy saytga o'tish
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-10 min-h-screen">
        {/* Admin Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-[0.3em] mb-1">Xush kelibsiz</h2>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white uppercase">Administrator</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 shadow-sm border border-neutral-100 dark:border-neutral-800 hover:text-mint transition-colors overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDarkMode ? 'dark' : 'light'}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDarkMode ? (
                    <span className="text-xl">☀️</span>
                  ) : (
                    <span className="text-xl">🌙</span>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 shadow-sm border border-neutral-100 dark:border-neutral-800 hover:text-mint transition-colors relative"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  </div>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-4 w-96 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                        <h3 className="font-bold text-neutral-900 dark:text-white">Xabarnomalar</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-mint/20 text-mint text-[10px] font-bold rounded-lg uppercase tracking-wide">
                            {unreadCount} ta yangi
                          </span>
                        )}
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-neutral-400">
                            <span className="text-2xl block mb-2">📭</span>
                            <span className="text-xs font-bold uppercase tracking-wide">Bildirishnomalar yo'q</span>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notif, index) => (
                            <Link 
                              href="/admin/messages" 
                              key={index}
                              onClick={() => setShowNotifications(false)}
                              className={`block p-4 border-b border-neutral-50 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors ${!notif.read ? 'bg-mint/5' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-mint/10 rounded-xl flex items-center justify-center text-lg shrink-0">
                                  💬
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1 line-clamp-2">
                                    {notif.message ? notif.message.replace(/Admin xabari \(.*?\): /, "") : "Xabar matni yo'q"}
                                  </p>
                                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">
                                    {formatTime(notif.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      
                      <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-white/5">
                        <Link 
                          href="/admin/messages"
                          onClick={() => setShowNotifications(false)}
                          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-neutral-500 hover:text-mint transition-colors uppercase tracking-wide"
                        >
                          Barchasini ko'rish
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-2 pr-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center font-black text-neutral-800">
                A
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900 dark:text-white">Admin Account</p>
                <p className="text-[10px] text-neutral-400 font-bold">Asosiy Admin</p>
              </div>
            </div>
            
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-neutral-100 dark:border-neutral-800 shadow-sm"
                title="Tizimdan chiqish"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
          </div>
        </header>

        <div className="relative z-10 block">
          {children}
        </div>
        
        {/* Background Decor */}
        <div className="fixed top-0 right-0 -z-0 opacity-20 pointer-events-none">
          <div className="w-[500px] h-[500px] bg-mint/10 rounded-full blur-[120px]" />
        </div>
      </main>
    </div>
  );
}
