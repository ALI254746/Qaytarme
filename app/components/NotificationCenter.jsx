"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  Heart,
  Link2,
  LoaderCircle,
  MessageCircle,
  Package,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

function notificationIcon(type) {
  const iconProps = { className: "h-[18px] w-[18px]", "aria-hidden": true };
  switch (type) {
    case "match": return <Link2 {...iconProps} />;
    case "message": return <MessageCircle {...iconProps} />;
    case "handover": return <ClipboardCheck {...iconProps} />;
    case "like": return <Heart {...iconProps} />;
    case "friend_request": return <UserRound {...iconProps} />;
    case "new-ariza": return <Package {...iconProps} />;
    case "system": return <ShieldCheck {...iconProps} />;
    case "expired": return <CalendarClock {...iconProps} />;
    default: return <Bell {...iconProps} />;
  }
}

function notificationTitle(notification) {
  if (notification.title) return notification.title;
  switch (notification.type) {
    case "match": return "Yangi moslik topildi";
    case "message": return "Yangi xabar";
    case "handover": return "Qabul qilish kutilmoqda";
    case "like": return "E’loningizga qiziqish bildirildi";
    case "new-ariza": return "E’lon holati yangilandi";
    case "admin_message": return "Administrator xabari";
    case "expired": return "E’lon muddati tugamoqda";
    default: return "Bildirishnoma";
  }
}

function notificationHref(notification) {
  const actionUrl = notification.actionUrl;
  if (typeof actionUrl === "string" && actionUrl.startsWith("/") && !actionUrl.startsWith("//")) {
    return actionUrl;
  }
  switch (notification.type) {
    case "match": return "/desktop/matches";
    case "message":
    case "handover": return "/desktop/messages";
    case "new-ariza":
    case "expired": return "/desktop/my-items";
    default: return "/desktop/notifications";
  }
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  if (hours < 48) return "Kecha";
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export default function NotificationCenter({
  compact = false,
  fullPage = false,
  onAdminReply,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const accessToken = session?.user?.accessToken;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const response = await fetch(getApiUrl("users/notifications"), {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Bildirishnomalarni yuklab bo‘lmadi");
      }
      const sorted = [...(Array.isArray(data.notifications) ? data.notifications : [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(sorted);
      setUnreadCount(Number(data.unreadCount) || 0);
      setError("");
    } catch (cause) {
      if (!silent) {
        setError(cause.message || "Bildirishnomalarni yuklab bo‘lmadi");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchNotifications();
    if (!accessToken) return undefined;
    const interval = setInterval(() => {
      void fetchNotifications({ silent: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [accessToken, fetchNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const markAllAsRead = async () => {
    if (!accessToken || unreadCount === 0) return;
    setPendingId("all");
    try {
      const response = await fetch(getApiUrl("users/notifications/read-all"), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bildirishnomalarni yangilab bo‘lmadi");
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      setError("");
    } catch (cause) {
      setError(cause.message || "Bildirishnomalarni yangilab bo‘lmadi");
    } finally {
      setPendingId("");
    }
  };

  const openNotification = async (notification) => {
    if (!accessToken || !notification?._id) return;
    setPendingId(String(notification._id));
    try {
      if (!notification.read) {
        const response = await fetch(
          getApiUrl(`users/notifications/${encodeURIComponent(notification._id)}/read`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ notificationId: notification._id }),
          },
        );
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Bildirishnomani o‘qilgan deb belgilab bo‘lmadi");
        }
        setNotifications((current) => current.map((item) =>
          String(item._id) === String(notification._id) ? { ...item, read: true } : item,
        ));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      setOpen(false);
      const senderId =
        typeof notification.from === "string"
          ? notification.from
          : notification.from?._id;
      if (
        notification.type === "admin_message" &&
        senderId &&
        onAdminReply
      ) {
        onAdminReply(String(senderId));
        return;
      }
      if (notification.type === "admin_message") {
        router.push(
          session?.user?.role === "admin"
            ? "/admin/messages"
            : "/desktop/messages",
        );
        return;
      }
      router.push(notificationHref(notification));
    } catch (cause) {
      setError(cause.message || "Bildirishnomani ochib bo‘lmadi");
    } finally {
      setPendingId("");
    }
  };

  const shownNotifications = fullPage ? notifications : notifications.slice(0, 6);
  const today = shownNotifications.filter((item) => isToday(item.createdAt));
  const older = shownNotifications.filter((item) => !isToday(item.createdAt));

  const notificationRows = (items) => items.map((notification) => (
    <li key={notification._id}>
      <button
        type="button"
        onClick={() => void openNotification(notification)}
        disabled={pendingId === String(notification._id)}
        className={`group flex min-h-[76px] w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-neutral-600 dark:hover:bg-slate-800 ${
          notification.read ? "bg-white dark:bg-slate-900" : "bg-neutral-50/70 dark:bg-neutral-950/40"
        }`}
      >
        <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          notification.read
            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            : "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
        }`}>
          {pendingId === String(notification._id)
            ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
            : notificationIcon(notification.type)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold leading-5 text-slate-900 dark:text-slate-100">
              {notificationTitle(notification)}
            </span>
            <span className="shrink-0 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-[1.45] text-slate-600 dark:text-slate-300">
            {notification.message}
          </span>
        </span>
        {!notification.read && (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-neutral-600" aria-label="O‘qilmagan" />
        )}
      </button>
    </li>
  ));

  if (fullPage) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Bildirishnomalar</h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {unreadCount ? `${unreadCount} ta o‘qilmagan` : "Hammasi ko‘rib chiqilgan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={pendingId === "all"}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {pendingId === "all" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Barchasini o‘qilgan qilish
              </button>
            )}
            <Link href="/desktop/settings" aria-label="Sozlamalar" className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 dark:text-slate-300 dark:hover:bg-slate-800">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
        <div className="mt-4">
          <NotificationItems
            loading={loading}
            notifications={shownNotifications}
            today={today}
            older={older}
            onRetry={() => void fetchNotifications()}
            rows={notificationRows}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Bildirishnomalar, ${unreadCount} ta o‘qilmagan` : "Bildirishnomalar"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative grid place-items-center text-slate-600 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 dark:text-slate-300 dark:hover:bg-slate-800 ${
          compact ? "h-9 w-9 rounded-full" : "h-10 w-10 rounded-xl lg:h-11 lg:w-11"
        }`}
      >
        <Bell className={`${compact ? "h-[18px] w-[18px]" : "h-5 w-5"}`} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-rose-600 px-1 text-[9px] font-bold leading-none text-white dark:border-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[1090] cursor-default bg-slate-950/10"
              aria-label="Bildirishnomalar oynasini yopish"
              onClick={() => setOpen(false)}
            />
            <motion.section
              role="dialog"
              aria-label="Bildirishnomalar"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className={`fixed left-2 right-2 top-14 z-[1101] flex max-h-[min(78vh,620px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_-18px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(420px,calc(100vw-1rem))] sm:max-h-[min(78vh,620px)] ${
                compact ? "sm:fixed sm:top-14" : ""
              }`}
            >
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Bildirishnomalar</h2>
                  {unreadCount > 0 && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{unreadCount} ta o‘qilmagan</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllAsRead()}
                      disabled={pendingId === "all"}
                      className="min-h-9 rounded-lg px-2 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-600 disabled:opacity-60 dark:text-neutral-200 dark:hover:bg-neutral-950"
                    >
                      {pendingId === "all" ? "Saqlanmoqda..." : "Barchasini o‘qilgan qilish"}
                    </button>
                  )}
                  <Link href="/desktop/settings" onClick={() => setOpen(false)} aria-label="Bildirishnoma sozlamalari" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-600 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </header>
              {error && (
                <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={() => void fetchNotifications()} className="shrink-0 font-semibold underline underline-offset-2">Qayta yuklash</button>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NotificationItems
                  loading={loading}
                  notifications={shownNotifications}
                  today={today}
                  older={older}
                  onRetry={() => void fetchNotifications()}
                  rows={notificationRows}
                />
              </div>
              <Link
                href="/desktop/notifications"
                onClick={() => setOpen(false)}
                className="m-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Barcha bildirishnomalarni ko‘rish
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItems({ loading, notifications, today, older, onRetry, rows }) {
  if (loading) {
    return (
      <div className="space-y-3 p-4" aria-label="Bildirishnomalar yuklanmoqda">
        <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }
  if (!notifications.length) {
    return (
      <div className="px-6 py-10 text-center">
        <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Hozircha bildirishnoma yo‘q</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Yangi moslik, xabar yoki e’lon holati shu yerda ko‘rinadi.</p>
        <button type="button" onClick={onRetry} className="mt-3 min-h-9 rounded-lg px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-950">Yangilash</button>
      </div>
    );
  }
  return (
    <div>
      {today.length > 0 && (
        <section aria-label="Bugungi bildirishnomalar">
          <h3 className="bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">Bugun</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">{rows(today)}</ul>
        </section>
      )}
      {older.length > 0 && (
        <section aria-label="Oldingi bildirishnomalar">
          <h3 className="bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">Oldinroq</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">{rows(older)}</ul>
        </section>
      )}
    </div>
  );
}
