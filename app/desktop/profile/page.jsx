"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";
import { useSnackbar, SnackbarProvider } from "notistack";
import Link from 'next/link';
import { useLanguage } from "@/context/LanguageContext";
import MyItemsTab from "./MyItemsTab";

// --- Animated Components ---

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const StatCard = ({ label, value, icon, color, delay }) => (
  <motion.div 
    variants={fadeIn}
    custom={delay}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 shadow-[0_10px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[160px] group cursor-default transition-shadow hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] relative overflow-hidden"
  >
     <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
     
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
     </div>
     <div className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight relative z-10">{value}</div>
     <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest relative z-10">{label}</div>
  </motion.div>
);

const SectionTitle = ({ children }) => (
  <motion.h3 variants={fadeIn} className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-mint" />
    {children}
  </motion.h3>
);

function ProfileContent() {
  const { t } = useLanguage();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  
  const [activeTab, setActiveTab] = useState("items");
  const [userData, setUserData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [editForm, setEditForm] = useState({ name: "", phone: "", bio: "" });

  useEffect(() => {
    try {
      const savedItems = JSON.parse(localStorage.getItem("qaytarme:saved-items") || "[]");
      setSavedItemsCount(Array.isArray(savedItems) ? savedItems.length : 0);
    } catch (error) {
      console.error("Could not load saved announcement count:", error);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (sessionStatus === "loading") return;
      if (!session?.user?.accessToken) return;
      try {
        const res = await fetch(getApiUrl("users/me"), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setEditForm({ name: data.name || "", phone: data.phone || "", bio: data.bio || "" });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, [session?.user?.accessToken, sessionStatus]);

  const handleSaveProfile = async () => {
    if (!session?.user?.accessToken) return;
    setSaving(true);
    try {
      const res = await fetch(getApiUrl("users/me"), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${session.user.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        if (updateSession) await updateSession({ ...session, user: { ...session.user, name: data.user.name }});
        enqueueSnackbar(t('profile_save_success'), { variant: "success" });
        setActiveTab("overview");
      }
    } catch {
      enqueueSnackbar(t('profile_save_error'), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !session?.user?.accessToken) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(getApiUrl("users/me/avatar"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        if (updateSession) await updateSession({ ...session, user: { ...session.user, image: data.user.avatar }});
        enqueueSnackbar(t('profile_avatar_success'), { variant: "success" });
      }
    } catch {
      enqueueSnackbar(t('profile_avatar_error'), { variant: "error" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const user = {
    name: userData?.name || session?.user?.name || t('profile_default_name'),
    email: userData?.email || session?.user?.email,
    image: userData?.avatar || session?.user?.image,
    phone: userData?.phone || "+998 -- --- -- --",
    bio: userData?.bio || t('profile_bio_empty'),
    stats: userData?.stats || { itemsLost: 0, itemsFound: 0, successfulReturns: 0 },
    points: userData?.points || 0
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerContainer}
      className="min-h-screen bg-[#f7f7f7] pb-8 space-y-4 dark:bg-neutral-950"
    >
       <div className="mx-4 flex items-center gap-2 pt-4 text-[11px] text-neutral-500 lg:mx-8">
          <Link href="/desktop" className="hover:text-neutral-900 dark:hover:text-white">Bosh sahifa</Link>
          <span aria-hidden="true">/</span>
          <span>Profil</span>
       </div>
       <h1 className="mx-4 text-2xl font-extrabold text-neutral-900 lg:mx-8 dark:text-white">Mening profilim</h1>

       <div className="relative mx-4 flex min-h-[72px] flex-col items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:flex-row lg:mx-8 dark:border-neutral-800 dark:bg-neutral-900">
          {/* Animated Background */}
          <div className="flex w-full items-center gap-3">
            <div className="relative group/avatar">
               <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  {user.image ? (
                     <img src={user.image} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                     <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-500">{user.name[0]}</div>
                  )}
               </div>
               <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-full flex items-center justify-center shadow cursor-pointer border border-neutral-100 dark:border-white/10">
                   {uploadingAvatar ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                   <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
               </label>
            </div>
            
            <div className="min-w-0">
               <h2 className="truncate text-sm font-bold text-neutral-900 dark:text-white">{user.name}</h2>
               <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-neutral-500">
                  <span className="truncate">
                     {user.email}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">✓ Tasdiqlangan</span>
                  <span>⌖ {userData?.city || userData?.region || "Joylashuv kiritilmagan"}</span>
                  {userData?.createdAt && <span>▣ {new Date(userData.createdAt).getFullYear()}-yildan beri</span>}
               </div>
            </div>
            <button type="button" onClick={() => setActiveTab("overview")} className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-[10px] font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">✎ Profilni tahrirlash</button>
          </div>
       </div>

       <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
             {[
               { label: "e’lon", value: user.stats.itemsLost + user.stats.itemsFound, icon: "▤" },
               { label: "topilgan", value: user.stats.itemsFound, icon: "●" },
               { label: "egasiga qaytarilgan", value: user.stats.successfulReturns, icon: "✓" },
               { label: "saqlangan", value: savedItemsCount, icon: "☆" },
             ].map((stat) => (
               <div key={stat.label} className="flex min-h-[54px] items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" aria-hidden="true">{stat.icon}</span>
                  <div className="min-w-0"><div className="text-sm font-bold leading-4 text-neutral-900 dark:text-white">{stat.value}</div><div className="truncate text-[9px] text-neutral-500">{stat.label}</div></div>
               </div>
             ))}
          </div>
          <div className="mb-4 flex gap-5 overflow-x-auto border-b border-neutral-200 px-1 dark:border-neutral-800">
             <button type="button" onClick={() => setActiveTab("items")} className={`flex shrink-0 items-center gap-2 border-b-2 px-2 py-3 text-[11px] font-semibold transition ${activeTab === "items" ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white" : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"}`}>
                <span aria-hidden="true">▤</span> {t("profile_menu_my_items")} <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[9px] dark:bg-neutral-800">{user.stats.itemsLost + user.stats.itemsFound}</span>
             </button>
             <button type="button" onClick={() => setActiveTab("overview")} className={`flex shrink-0 items-center gap-2 border-b-2 px-2 py-3 text-[11px] font-semibold transition ${activeTab === "overview" ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white" : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"}`}>
                <span aria-hidden="true">♙</span> {t("profile_info_title")}
             </button>
             <Link href="/desktop/messages" className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-2 py-3 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"><span aria-hidden="true">◌</span> {t("nav_messages")}</Link>
             <Link href="/desktop/settings" className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-2 py-3 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"><span aria-hidden="true">⚙</span> {t("profile_menu_settings")}</Link>
          </div>

          {activeTab === "items" ? <MyItemsTab /> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Left Column: Stats & Quick Actions */}
             <div className="space-y-6">
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none">
                   <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mint" /> {t('profile_stats_title')}
                   </h3>
                   <div className="space-y-4">
                      <div className="p-4 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-mint/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            </div>
                            <div>
                               <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('profile_total_items')}</div>
                               <div className="text-xl font-black text-neutral-900 dark:text-white">{user.stats.itemsLost + user.stats.itemsFound}</div>
                            </div>
                         </div>
                      </div>

                      <div className="p-4 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-mint/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-mint/10 text-mint flex items-center justify-center">
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                               <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('profile_successful_items')}</div>
                               <div className="text-xl font-black text-neutral-900 dark:text-white">{user.stats.successfulReturns}</div>
                            </div>
                         </div>
                      </div>

                      <div className="p-4 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-mint/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                               <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t('profile_points')}</div>
                               <div className="text-xl font-black text-neutral-900 dark:text-white">{user.points}</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none">
                   <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mint" /> {t('profile_menus_title')}
                   </h3>
                   <div className="space-y-3">
                      <button type="button" onClick={() => setActiveTab("items")} className="flex w-full items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:bg-mint hover:text-neutral-900 group transition-all">
                         <span className="text-sm font-bold flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            {t('profile_menu_my_items')}
                         </span>
                         <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <Link href="/desktop/settings" className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 group transition-all">
                         <span className="text-sm font-bold flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {t('profile_menu_settings')}
                         </span>
                         <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                   </div>
                </div>
             </div>

             {/* Center/Right Column: Main Edit Form */}
             <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 lg:p-12 border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none h-full">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                           <span className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800">👤</span>
                           {t('profile_info_title')}
                        </h2>
                        <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
                           {saving ? '...' : t('profile_btn_save')}
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{t('profile_label_fullname')}</label>
                           <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-mint transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                              <input 
                                 type="text" 
                                 value={editForm.name} 
                                 onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                 className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-mint transition-all border border-transparent focus:border-mint" 
                                 placeholder={t('profile_placeholder_name')}
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{t('profile_label_phone')}</label>
                           <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-mint transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              </div>
                              <input 
                                 type="tel" 
                                 value={editForm.phone} 
                                 onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                                 className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-mint transition-all border border-transparent focus:border-mint" 
                                 placeholder="+998 -- --- -- --"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{t('profile_label_bio')}</label>
                        <div className="relative group">
                           <div className="absolute top-4 left-4 pointer-events-none text-neutral-400 group-focus-within:text-mint transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </div>
                           <textarea 
                              value={editForm.bio} 
                              onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                              className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-mint transition-all border border-transparent focus:border-mint min-h-[150px] resize-none" 
                              placeholder={t('profile_placeholder_bio')}
                           />
                        </div>
                     </div>

                 </div>
             </div>
          </div>}
       </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  return (
    <SnackbarProvider>
      <ProfileContent />
    </SnackbarProvider>
  );
}
