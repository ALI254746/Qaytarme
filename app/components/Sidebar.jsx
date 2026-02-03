"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

// Custom Icons for WOW effect
const SidebarIcons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  addItem: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  myItems: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  matches: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  messages: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  about: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const cardNumber = "9860350142337368";

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    { name: t("nav_home"), icon: SidebarIcons.dashboard, href: "/desktop" },
    { name: t("nav_map"), icon: SidebarIcons.map, href: "/desktop/map" },
    { name: t("nav_add"), icon: SidebarIcons.addItem, href: "/desktop/add" },
    { name: t("nav_my_items"), icon: SidebarIcons.myItems, href: "/desktop/my-items" },
    { name: t("nav_matches"), icon: SidebarIcons.matches, href: "/desktop/matches" },
    { name: t("nav_messages"), icon: SidebarIcons.messages, href: "/desktop/messages" },
    { name: t("nav_profile"), icon: SidebarIcons.profile, href: "/desktop/profile" },
    { name: t("nav_about"), icon: SidebarIcons.about, href: "/desktop/about" },
    { name: t("nav_settings"), icon: SidebarIcons.settings, href: "/desktop/settings" },
  ];

  return (
    <aside className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-72'} h-screen fixed left-0 top-0 bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 flex-col z-50 transition-all duration-300`}>
      {/* Logo & Toggle */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-mint to-[#8bb3a9] rounded-xl flex items-center justify-center text-neutral-800 shadow-lg shadow-mint/20 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden">QaytarMe</span>
          </div>
        )}
        
        <button 
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          ) : (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-hide py-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const iconClass = `${isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-mint"} transition-colors`;
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 5 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? "bg-mint text-neutral-800 shadow-lg shadow-mint/20"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-ivory dark:hover:bg-mint/10 hover:text-neutral-800 dark:hover:text-mint"
                }`}
                title={isCollapsed ? item.name : ""}
              >
                <div className={iconClass}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 bg-neutral-800 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Admin Link - Conditional */}
        {session?.user?.role === "admin" && (
          <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Link href="/admin">
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 5 }}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-lg`}
                title="Admin Panel"
              >
                <span className="text-xl">🛡️</span>
                {!isCollapsed && <span className="font-bold text-sm">Admin Panel</span>}
              </motion.div>
            </Link>
          </div>
        )}
      </nav>

      {/* Donate Banner */}
      {!isCollapsed && (
        <div className="p-4 mx-4 mb-4 bg-ivory dark:bg-neutral-900 rounded-2xl border border-mint/20 relative overflow-hidden group">
          {/* Decorative bg */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-mint/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <h4 className="text-neutral-800 dark:text-white text-xs font-bold mb-1 uppercase tracking-tighter relative z-10">{t("donate_title")}</h4>
          <p className="text-neutral-500 dark:text-neutral-400 text-[10px] mb-3 relative z-10">{t("donate_desc")}</p>
          
          <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-neutral-100 dark:border-white/5 mb-2 relative z-10">
            <p className="text-[10px] font-mono text-center font-bold text-neutral-600 dark:text-neutral-300 tracking-wider">
              {cardNumber.match(/.{1,4}/g).join(" ")}
            </p>
          </div>

          <button 
            onClick={handleCopy}
            className="w-full py-2 bg-mint text-neutral-800 text-[10px] font-bold rounded-lg hover:brightness-95 transition-all shadow-sm flex items-center justify-center gap-2 relative z-10"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {t("donate_copied")}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                {t("donate_copy")}
              </>
            )}
          </button>
        </div>
      )}

      {/* Telegram Bot Link */}
      <div className={`p-4 mx-4 mb-4 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => window.open('https://t.me/qaytarme_app_bot', '_blank')}
          className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-4 py-3'} bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group`}
          title={isCollapsed ? "Telegram" : ""}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {!isCollapsed && (
            <span className="text-xs font-bold">Dasturimiz siz uchun qulay</span>
          )}
        </button>
      </div>
      
    </aside>
  );
}
