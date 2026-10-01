"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

const icons = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  add: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></>,
  items: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 5V3h8v2m-8 5h8m-8 4h5" /></>,
  matches: <path d="M20.8 8.8c0 5.4-8.8 10.6-8.8 10.6S3.2 14.2 3.2 8.8a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" />,
  messages: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9L16 21h-3l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9L13 8h3l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.4Z" /></>,
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar({ isCollapsed, compactHeader = false, toggleSidebar }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const menuItems = [
    { id: "home", name: t("nav_home"), href: "/desktop", icon: "home" },
    { id: "map", name: t("nav_map"), href: "/desktop/map", icon: "map" },
    { id: "add", name: t("nav_add"), href: "/desktop/add", icon: "add" },
    { id: "matches", name: t("nav_matches"), href: "/desktop/matches", icon: "matches" },
    { id: "messages", name: t("nav_messages"), href: "/desktop/messages", icon: "messages" },
    { id: "profile", name: t("nav_profile"), href: "/desktop/profile", icon: "profile" },
  ];
  const secondaryItems = compactHeader ? [] : [
    { id: "about", name: t("nav_about"), href: "/desktop/about", icon: "about" },
    { id: "settings", name: t("nav_settings"), href: "/desktop/settings", icon: "settings" },
  ];

  const renderLink = (item) => {
    const isActive = pathname === item.href || (item.href !== "/desktop" && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        key={item.id}
        href={item.href}
        title={isCollapsed ? item.name : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`flex h-10 items-center rounded-lg text-xs font-semibold transition ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-3"
        } ${
          isActive
            ? "bg-[#e4e4e4] text-[#161616]"
            : "text-[#555] hover:bg-[#f1f1f1] hover:text-[#171717]"
        }`}
      >
        <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-[#e4e4e4] bg-[#fafafa] transition-all duration-300 md:flex ${
      isCollapsed ? "w-16" : compactHeader ? "w-[168px]" : "w-40"
    }`}>
      <div className={`flex shrink-0 items-center border-b border-[#ededed] ${
        compactHeader ? "h-[42px]" : "h-[60px]"
      } ${
        isCollapsed ? "justify-center px-2" : compactHeader ? "justify-start px-4" : "justify-between px-3"
      }`}>
        <Link href="/desktop" className={`flex min-w-0 items-center ${compactHeader ? "gap-2.5" : "gap-3"}`}>
          <span className={`grid shrink-0 place-items-center rounded-lg bg-[#242424] text-white ${compactHeader ? "h-7 w-7" : "h-8 w-8"}`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2.4" />
              <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-extrabold tracking-tight text-[#222]">QaytarMe</span>
              {!compactHeader && <span className="block text-[9px] text-[#777]">Toping. Qaytaring.</span>}
            </span>
          )}
        </Link>
        {toggleSidebar && !compactHeader && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Yon panelni kengaytirish" : "Yon panelni yig'ish"}
            className="rounded-md p-1 text-[#777] transition hover:bg-[#eee] hover:text-[#222]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isCollapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {menuItems.map(renderLink)}
        {session?.user?.role === "admin" && renderLink({ id: "admin", name: "Admin panel", href: "/admin", icon: "settings" })}
        <div className="my-2 border-t border-[#e9e9e9]" />
        {secondaryItems.map(renderLink)}
      </nav>

      <div className="shrink-0 border-t border-[#e5e5e5] p-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? t("logout") || "Chiqish" : undefined}
          className={`flex h-10 w-full items-center rounded-lg text-xs font-semibold text-[#444] transition hover:bg-[#ededed] ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          {!isCollapsed && <span>{t("logout") || "Chiqish"}</span>}
        </button>
      </div>
    </aside>
  );
}
