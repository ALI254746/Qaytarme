"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useSnackbar, SnackbarProvider } from "notistack";

// --- Components for "Native-Like" Feel ---

const SectionHeader = ({ title }) => (
  <div className="px-4 pb-2 pt-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
    {title}
  </div>
);

const MenuItem = ({ icon, label, value, onClick, isLink, href, isDestructive, hasToggle, isToggled, chevron = true }) => {
  const content = (
    <div className={`flex items-center justify-between p-4 bg-white dark:bg-neutral-900 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors ${isDestructive ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon && <div className={`text-xl ${isDestructive ? 'opacity-100' : 'text-neutral-400'}`}>{icon}</div>}
        <span className="font-medium text-[15px]">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-neutral-400">{value}</span>}
        
        {hasToggle && (
           <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isToggled ? 'bg-mint' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isToggled ? 'left-[22px]' : 'left-0.5'}`} />
           </div>
        )}
        
        {chevron && !hasToggle && (
          <svg className="w-5 h-5 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (isLink && href) {
    return <Link href={href} className="block border-b border-neutral-100 dark:border-neutral-800 last:border-none">{content}</Link>;
  }

  return (
    <button onClick={onClick} className="w-full text-left border-b border-neutral-100 dark:border-neutral-800 last:border-none outline-none">
      {content}
    </button>
  );
};

function MobileProfileContent() {
  const { data: session, update: updateSession } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, lang, changeLanguage } = useLanguage();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  
  // Settings State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  // Edit Profile State
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Admin Message State


  useEffect(() => {
     if (session?.user) {
        setEditForm({
           name: session.user.name || "",
           phone: session.user.phone || ""
        });
     }
  }, [session]);

  const handleSaveProfile = async () => {
   if (!session?.user?.accessToken) return;
   setSavingProfile(true);
   try {
     const res = await fetch(getApiUrl("users/me"), {
       method: "PUT",
       headers: { "Authorization": `Bearer ${session.user.accessToken}`, "Content-Type": "application/json" },
       body: JSON.stringify(editForm)
     });
     if (res.ok) {
       const data = await res.json();
       if (updateSession) await updateSession({ ...session, user: { ...session.user, name: data.user.name, phone: data.user.phone }});
       enqueueSnackbar(t('profile_save_success') || "Profil saqlandi", { variant: "success" });
       setShowEditProfile(false);
     }
   } catch {
     enqueueSnackbar(t('profile_save_error') || "Xatolik yuz berdi", { variant: "error" });
   } finally {
     setSavingProfile(false);
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
       if (updateSession) await updateSession({ ...session, user: { ...session.user, image: data.user.avatar }});
       enqueueSnackbar(t('profile_avatar_success') || "Rasm yangilandi", { variant: "success" });
     }
   } catch {
     enqueueSnackbar(t('profile_avatar_error') || "Xatolik", { variant: "error" });
   } finally {
     setUploadingAvatar(false);
   }
 };



  // User Data State
  const [userData, setUserData] = useState(session?.user || null);

  useEffect(() => {
     if (session?.user?.accessToken) {
        fetch(getApiUrl("users/me"), {
           headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        })
        .then(res => res.json())
        .then(data => {
            // Check if response is { user: ... } or just user object
            setUserData(data.user || data);
        })
        .catch(err => console.error(err));
     }
  }, [session]);

  const userImage = userData?.image || userData?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.name || 'User'}`;
  
  const languages = [
    { code: 'uz', label: 'O\'zbekcha' },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
    { code: 'kk', label: 'Qazaqsha' },
    { code: 'ky', label: 'Kyrgyzcha' },
    { code: 'kaa', label: 'Qaraqalpaqsha' }
  ];

  const currentLangLabel = languages.find(l => l.code === lang)?.label || 'O\'zbekcha';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black pb-32">
       
       {/* Top Profile Card */}
       <div className="bg-white dark:bg-neutral-900 pb-8 pt-6 mb-4 shadow-sm rounded-b-[2.5rem]">
          <div className="flex flex-col items-center justify-center relative px-6">
             <div className="relative mb-3 group">
               <div className="w-24 h-24 rounded-full p-1 border-2 border-neutral-100 dark:border-neutral-800 relative overflow-hidden">
                  <img src={userImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  {uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/></div>}
               </div>
               <label className="absolute bottom-0 right-0 bg-mint w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform">
                  <svg className="w-4 h-4 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
               </label>
             </div>
             
             <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-0.5">{userData?.name}</h1>
             <p className="text-sm text-neutral-500 mb-4">{userData?.phone || userData?.email}</p>
             
             {/* Badges List - Moved here for better layout */}
             {userData?.badges?.length > 0 && (
                 <div className="flex flex-wrap justify-center gap-2 mb-6">
                     {userData.badges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">
                           <span className="text-xs">🏅</span>
                           <span className="text-[10px] font-bold uppercase tracking-wide">{badge}</span>
                        </div>
                     ))}
                 </div>
             )}
             
             <button 
               onClick={() => setShowEditProfile(true)}
               className="px-8 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-neutral-200 dark:shadow-neutral-800 hover:scale-105 transition-transform"
             >
               {t('edit_profile') || "Profilni tahrirlash"}
             </button>
          </div>
       </div>

       {/* Detailed Statistics Section */}
       <div className="px-4 mb-8">
           <h3 className="px-2 mb-3 text-xs font-bold text-neutral-400 uppercase tracking-widest">Statistika</h3>
           <div className="grid grid-cols-2 gap-3">
               {/* 1. Topganlarim (Found by me) */}
               <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-mint/20 shadow-sm flex flex-col justify-between gap-4 group active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-mint/10 text-mint">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"></path><path d="M2 7h20v5H2z"></path><path d="M12 22V7"></path><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">Topganlarim</p>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{userData?.stats?.found || 0}</h3>
                    </div>
               </div>

               {/* 2. Yo'qotganlarim (Lost by me) */}
               <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-red-500/20 shadow-sm flex flex-col justify-between gap-4 group active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-red-500/10 text-red-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">Yo'qotganlarim</p>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{userData?.stats?.lost || 0}</h3>
                    </div>
               </div>

               {/* 3. Topib berishgan (Found for me) */}
               <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-blue-500/20 shadow-sm flex flex-col justify-between gap-4 group active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-blue-500/10 text-blue-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">Topib berishgan</p>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{userData?.stats?.returnedToMe || 0}</h3>
                    </div>
               </div>

               {/* 4. Topib berganman (Returned by me) */}
               <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-amber-500/20 shadow-sm flex flex-col justify-between gap-4 group active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-amber-500/10 text-amber-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">Topib berganman</p>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{userData?.stats?.returnedByMe || 0}</h3>
                    </div>
               </div>

               {/* 5. Jarayonda (In Progress) full width */}
               <div className="col-span-2 bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-purple-500/20 shadow-sm flex items-center justify-between gap-4 group active:scale-95 transition-transform">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-purple-500/10 text-purple-500">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">Jarayonda</p>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-none">Faol kelishuvlar</h3>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-neutral-900 dark:text-white pr-2">{userData?.stats?.inProcess || 0}</div>
               </div>
           </div>
       </div>

       {/* Settings Groups */}
       <div className="space-y-6">
          
          {/* Section: App Settings */}
          <div>
            <SectionHeader title={t('app_settings') || "Ilova sozlamalari"} />
            <div className="border-y border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>}
                  label={t('theme_dark') || "Tungi rejim"}
                  hasToggle
                  isToggled={isDarkMode}
                  onClick={toggleTheme}
                  chevron={false}
               />
               <MenuItem 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}
                  label={t('select_language') || "Til"}
                  value={currentLangLabel}
                  onClick={() => setShowLanguageSheet(true)}
               />
            </div>
          </div>

          {/* Section: Notifications */}
          <div>
            <SectionHeader title={t('notifications') || "Bildirishnomalar"} />
            <div className="border-y border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
                  label={t('push_notifications') || "Push xabarlar"}
                  hasToggle
                  isToggled={pushEnabled}
                  onClick={() => setPushEnabled(!pushEnabled)}
                  chevron={false}
               />
               <MenuItem 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
                  label={t('email_notifications') || "Email xabarlar"}
                  hasToggle
                  isToggled={emailEnabled}
                  onClick={() => setEmailEnabled(!emailEnabled)}
                  chevron={false}
               />
            </div>
          </div>

          {/* Section: Support */}
          <div>
            <SectionHeader title={t('support') || "Yordam"} />
            <div className="border-y border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  isLink
                  href="/mobile/contact"
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>}
                  label={t('contact_admin') || "Admin bilan bog'lanish"}
               />
               <MenuItem 
                  isLink
                  href="/mobile/about"
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
                  label={t('about_us') || "Dastur haqida"}
               />
            </div>
          </div>

          {/* Section: Account */}
          <div>
             <div className="border-y border-neutral-200 dark:border-neutral-800 mt-4">
               <MenuItem 
                  isDestructive
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>}
                  label={t('logout') || "Chiqish"}
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  chevron={false}
               />
             </div>
             <p className="text-center text-neutral-400 text-[10px] mt-4 uppercase tracking-widest font-bold">QaytarMe v1.5</p>
          </div>

       </div>

       {/* --- DRAWERS / SHEETS --- */}

       {/* Edit Profile Sheet */}
       <AnimatePresence>
          {showEditProfile && (
             <>
                <div className="fixed inset-0 bg-black/50 z-[1200] backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
                <motion.div
                   initial={{ y: "100%" }}
                   animate={{ y: 0 }}
                   exit={{ y: "100%" }}
                   transition={{ type: "spring", damping: 25, stiffness: 300 }}
                   className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-[1210] overflow-hidden pb-8 h-[80vh] flex flex-col"
                >
                   <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                      <button onClick={() => setShowEditProfile(false)} className="text-sm font-bold text-neutral-500">{t('cancel') || "Bekor"}</button>
                      <h3 className="text-base font-bold dark:text-white">{t('edit_profile') || "Tahrirlash"}</h3>
                      <button 
                        onClick={handleSaveProfile} 
                        disabled={savingProfile}
                        className="text-sm font-bold text-mint disabled:opacity-50"
                     >
                        {savingProfile ? '...' : (t('save') || "Saqlash")}
                     </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('fullname') || "F.I.SH"}</label>
                            <input 
                              type="text" 
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white font-bold outline-none border border-transparent focus:border-mint"
                              placeholder="Ismingiz"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('phone') || "Telefon raqam"}</label>
                            <input 
                              type="tel" 
                              value={editForm.phone}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                              className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white font-bold outline-none border border-transparent focus:border-mint"
                              placeholder="+998"
                            />
                         </div>
                      </div>
                   </div>
                </motion.div>
             </>
          )}
       </AnimatePresence>

       {/* Language Sheet (Bottom Drawer) */}
       <AnimatePresence>
          {showLanguageSheet && (
             <>
                <div className="fixed inset-0 bg-black/50 z-[1200] backdrop-blur-sm" onClick={() => setShowLanguageSheet(false)} />
                <motion.div
                   initial={{ y: "100%" }}
                   animate={{ y: 0 }}
                   exit={{ y: "100%" }}
                   transition={{ type: "spring", damping: 25, stiffness: 300 }}
                   className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-[1210] overflow-hidden pb-8 max-h-[70vh]"
                >
                   <div className="flex justify-center pt-3 pb-2">
                      <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full"/>
                   </div>
                   <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 mb-2">
                      <h3 className="text-lg font-bold text-center dark:text-white">Tilni tanlang</h3>
                   </div>
                   <div className="overflow-y-auto">
                      {languages.map((l) => (
                         <button
                            key={l.code}
                            onClick={() => { changeLanguage(l.code); setShowLanguageSheet(false); }}
                            className={`w-full flex items-center justify-between px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 last:border-none ${lang === l.code ? 'text-mint font-bold' : 'text-neutral-700 dark:text-neutral-300'}`}
                         >
                            <span>{l.label}</span>
                            {lang === l.code && (
                               <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                         </button>
                      ))}
                   </div>
                   <div className="p-4 safe-area-pb">
                      <button onClick={() => setShowLanguageSheet(false)} className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-600 dark:text-neutral-400">Bekor qilish</button>
                   </div>
                </motion.div>
             </>
          )}
       </AnimatePresence>


    </div>
  );
}

export default function MobileProfilePage() {
   return (
      <SnackbarProvider maxSnack={1} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
         <MobileProfileContent />
      </SnackbarProvider>
   );
}
