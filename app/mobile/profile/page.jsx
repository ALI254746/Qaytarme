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
    <div className="min-h-screen bg-white dark:bg-black pb-24">
       
       {/* Instagram-style Header */}
       <div className="px-4 pt-12 pb-4">
          
          {/* Top Row: Avatar & Stats */}
          <div className="flex items-center gap-6 mb-4">
             {/* Avatar */}
             <div className="relative shrink-0">
                 <div className="w-20 h-20 rounded-full p-0.5 border border-neutral-200 dark:border-neutral-800 relative z-10">
                    <img src={userImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                 </div>
                 <label className="absolute bottom-0 right-0 bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-black z-20">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                 </label>
             </div>

             {/* Stats */}
             <div className="flex-1 flex justify-around">
                 <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{userData?.stats?.found || 0}</span>
                    <span className="text-[11px] text-neutral-500">Topilgan</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{userData?.stats?.lost || 0}</span>
                    <span className="text-[11px] text-neutral-500">Yo'qotilgan</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{userData?.stats?.inProcess || 0}</span>
                    <span className="text-[11px] text-neutral-500">Jarayonda</span>
                 </div>
             </div>
          </div>

          {/* Bio Section */}
          <div className="mb-4 px-1">
             <h1 className="text-sm font-bold text-neutral-900 dark:text-white">{userData?.name}</h1>
             <p className="text-sm text-neutral-500 whitespace-pre-wrap">{userData?.phone || userData?.email}</p>
             {userData?.badges?.length > 0 && (
                 <div className="text-xs text-blue-500 mt-1">
                     {userData.badges.join(" • ")}
                 </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
             <button 
               onClick={() => setShowEditProfile(true)}
               className="flex-1 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-bold border border-transparent active:scale-95 transition-transform"
             >
               Tahrirlash
             </button>
             <button 
               onClick={() => router.push('/mobile/share')}
               className="flex-1 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-bold border border-transparent active:scale-95 transition-transform"
             >
               Ulashish
             </button>
          </div>

       </div>

       {/* Divider (Optional, or just start list) */}
       {/* <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-4 mb-2" /> */}

       {/* Settings Groups (iOS/Instagram Style) */}
       <div className="space-y-6 px-4 mt-2">
          
          {/* Section: App Settings */}
          <div>
            <SectionHeader title="Ilova Sozlamalari" />
            <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>}
                  label={t('theme_dark') || "Tungi rejim"}
                  hasToggle
                  isToggled={isDarkMode}
                  onClick={toggleTheme}
                  chevron={false}
               />
               <MenuItem 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}
                  label={t('select_language') || "Til"}
                  value={currentLangLabel}
                  onClick={() => setShowLanguageSheet(true)}
               />
            </div>
          </div>

          {/* Section: Notifications */}
          <div>
            <SectionHeader title={t('notifications') || "Bildirishnomalar"} />
            <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
                  label={t('push_notifications') || "Push xabarlar"}
                  hasToggle
                  isToggled={pushEnabled}
                  onClick={() => setPushEnabled(!pushEnabled)}
                  chevron={false}
               />
            </div>
          </div>

          {/* Section: Support */}
          <div>
            <SectionHeader title={t('support') || "Yordam"} />
            <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
               <MenuItem 
                  isLink
                  href="/mobile/contact"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>}
                  label={t('contact_admin') || "Admin bilan bog'lanish"}
               />
               <MenuItem 
                  isLink
                  href="/mobile/about"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
                  label={t('about_us') || "Dastur haqida"}
               />
               <MenuItem 
                  isDestructive
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>}
                  label={t('logout') || "Chiqish"}
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  chevron={false}
               />
            </div>
            <p className="text-center text-neutral-400 text-[10px] mt-6 uppercase tracking-widest font-bold opacity-50">QaytarMe v2.0</p>
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
