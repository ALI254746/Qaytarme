"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function TelegramChannelsPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchChannels = async () => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await fetch(getApiUrl("admin/telegram-channels"), {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (e) {
      console.error("Failed to fetch channels", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [session]);

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("admin/telegram-channels"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ username: newChannel, description: "Added via Admin Panel" }),
      });

      if (res.ok) {
        setNewChannel("");
        fetchChannels();
      } else {
        const errData = await res.json();
        setError(errData.message || "Xatolik yuz berdi");
      }
    } catch (e) {
      setError("Tarmoq xatoligi");
    } finally {
      setAdding(false);
    }
  };

  const handeDeleteChannel = async (id) => {
    if (!confirm("Haqiqatan ham bu kanalni o'chirmoqchimisiz?")) return;

    try {
      const res = await fetch(getApiUrl(`admin/telegram-channels/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      });
      if (res.ok) {
        fetchChannels();
      }
    } catch (e) {
      alert("O'chirishda xatolik");
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-100 dark:border-white/5 shadow-xl">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">📢</span> 
          Telegram Kanallar Boshqaruvi
        </h2>

        {/* Add Form */}
        <form onSubmit={handleAddChannel} className="mb-8 bg-neutral-50 dark:bg-white/5 p-6 rounded-2xl border border-neutral-100 dark:border-white/5">
          <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wide">Yangi Kanal Username</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="@kanal_nomi yoki havola"
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border-2 border-neutral-100 dark:border-neutral-700 focus:border-mint outline-none transition-all font-medium"
            />
            <button
              type="submit"
              disabled={adding || !newChannel}
              className="px-8 py-3 bg-mint hover:bg-mint/90 text-neutral-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-mint/20"
            >
              {adding ? "Qo'shilmoqda..." : "Qo'shish"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
        </form>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence>
            {channels.length === 0 ? (
              <p className="text-center text-neutral-400 py-10">Hozircha kanallar yo'q</p>
            ) : (
              channels.map((channel) => (
                <motion.div
                  key={channel._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center text-2xl">
                      📣
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 dark:text-white">@{channel.username}</h3>
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-wide">
                        {new Date(channel.createdAt).toLocaleDateString()} da qo'shilgan
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-lg uppercase tracking-wide">
                        Faol
                     </span>
                     <button
                        onClick={() => handeDeleteChannel(channel._id)}
                        className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="O'chirish"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                     </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
