"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext"; // Import useLanguage
import Link from 'next/link';
import axios from 'axios';
import { getApiUrl } from "@/lib/api-config";
import { useSnackbar, SnackbarProvider } from "notistack";
import { useRouter } from "next/navigation";

// --- Reusable Components ---

const Toggle = ({ active, onChange }) => (
  <button 
    onClick={onChange}
    className={`w-[52px] h-[32px] rounded-full transition-all relative shadow-inner shrink-0 ${active ? 'bg-mint' : 'bg-neutral-200 dark:bg-neutral-800'}`}
  >
    <motion.div 
      layout
      className="absolute top-[3px] left-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md backdrop-blur-sm"
      animate={{ x: active ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </button>
);

const MenuButton = ({ icon, label, description, active, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all border ${
      active 
        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-xl' 
        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-white/5 hover:border-mint/50 dark:hover:border-mint/50 group'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${active ? 'bg-white/20 text-white dark:bg-neutral-900/10 dark:text-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover:text-mint group-hover:bg-mint/10'}`}>
       {icon}
    </div>
    <div className="flex-1">
      <div className="font-bold text-sm tracking-wide">{label}</div>
      <div className={`text-[10px] font-medium mt-0.5 ${active ? 'text-white/60 dark:text-neutral-900/60' : 'text-neutral-400'}`}>{description}</div>
    </div>
    {active && <motion.div layoutId="activeIndicator" className="w-1.5 h-1.5 rounded-full bg-mint" />}
  </motion.button>
);

const SettingSection = ({ title, description, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="bg-white dark:bg-neutral-900 p-8 lg:p-10 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none h-full"
  >
     <div className="mb-8 border-b border-neutral-100 dark:border-white/5 pb-6">
        <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{title}</h2>
        <p className="text-neutral-500 font-medium">{description}</p>
     </div>
     <div className="space-y-4">
        {children}
     </div>
  </motion.div>
);

const OptionRow = ({ icon, label, subLabel, action, destructive }) => (
  <div className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${
    destructive 
      ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
      : 'bg-neutral-50 dark:bg-neutral-800/50 border-transparent hover:border-mint/30 hover:bg-white dark:hover:bg-neutral-800 shadow-sm hover:shadow-md'
  }`}>
     <div className="flex items-center gap-5">
        <div className={`text-xl p-3 rounded-xl ${destructive ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-white dark:bg-neutral-700 text-neutral-500 shadow-sm'}`}>
          {icon}
        </div>
        <div>
          <div className={`font-bold text-sm ${destructive ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>{label}</div>
          {subLabel && <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1">{subLabel}</div>}
        </div>
     </div>
     <div>{action}</div>
  </div>
);

function SettingsContent() {
  const { t, language: currentLanguage, changeLanguage } = useLanguage(); // Use hook
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState("general");
  const [notifications, setNotifications] = useState({ push: true, email: false, matches: true });
  // const [language, setLanguage] = useState('uz'); // Removed local state, use context
  
  // Support Form State
  const [supportMessage, setSupportMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!supportMessage.trim()) {
       enqueueSnackbar(t('settings_error_empty'), { variant: 'warning' });
       return;
    }

    setIsSending(true);
    try {
      const res = await fetch(getApiUrl('admin/contact'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.accessToken}`
          },
          body: JSON.stringify({ message: supportMessage })
      });

      if (res.ok) {
        enqueueSnackbar(t('settings_send_success'), { variant: 'success' });
        setSupportMessage("");
      } else {
        throw new Error('Xatolik');
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('settings_send_error'), { variant: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const sections = [
    { 
      id: 'general', 
      label: t('settings_menu_general'), 
      description: t('settings_menu_general_desc'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> 
    },
    { 
      id: 'notifications', 
      label: t('settings_menu_notifications'), 
      description: t('settings_menu_notifications_desc'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> 
    },
    { 
      id: 'security', 
      label: t('settings_menu_security'), 
      description: t('settings_menu_security_desc'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> 
    },
    { 
      id: 'support', 
      label: t('settings_menu_support'), 
      description: t('settings_menu_support_desc'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6E2] dark:bg-black pb-20 space-y-8">
       {/* Premium Header */}
       <div className="relative bg-neutral-900 dark:bg-white mx-4 lg:mx-8 mt-4 lg:mt-8 rounded-[3rem] p-8 lg:p-12 overflow-hidden shadow-2xl shadow-neutral-900/20 dark:shadow-none min-h-[250px] flex flex-col items-start justify-center gap-6 group">
          {/* Animated Background */}
         <div className="absolute inset-0 overflow-hidden">
             {/* Blob 1 - Top Right - Mint - Large Spread */}
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 animate-pulse duration-3000" />
             
             {/* Blob 2 - Bottom Left - Mint - Large Spread */}
             <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 animate-pulse duration-5000" />
             
             {/* Subtle Texture Overlay */}
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
         </div>

         <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <Link href="/desktop/profile" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white dark:text-neutral-900 dark:bg-black/5 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {t('settings_back')}
              </Link>
              <div>
                <h1 className="text-4xl lg:text-6xl font-black text-white dark:text-neutral-900 mb-2 tracking-tighter">{t('settings_title')}</h1>
                <p className="text-neutral-400 dark:text-neutral-500 font-medium text-lg">{t('settings_subtitle')}</p>
              </div>
            </div>
            
            <div className="hidden md:block">
               <div className="w-16 h-16 rounded-2xl bg-[#A9D3C9] flex items-center justify-center text-3xl shadow-[0_0_30px_-5px_#A9D3C9] animate-pulse">
                  ⚙️
               </div>
            </div>
         </div>
       </div>

       <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
             
             {/* Left Sidebar Navigation */}
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none">
                   <div className="space-y-2">
                      {sections.map(section => (
                         <MenuButton 
                            key={section.id}
                            {...section}
                            active={activeSection === section.id}
                            onClick={() => setActiveSection(section.id)}
                         />
                      ))}
                   </div>
                   
                   <div className="my-6 h-px bg-neutral-100 dark:bg-neutral-800" />
                   
                   <button 
                      onClick={() => signOut()} 
                      className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 group"
                   >
                      <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-xl group-hover:bg-white dark:group-hover:bg-red-900/40 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-sm tracking-wide">{t('settings_logout')}</div>
                        <div className="text-[10px] font-medium mt-0.5 text-red-400">{t('settings_logout_desc')}</div>
                      </div>
                   </button>
                </div>

                <div className="text-center">
                   <p className="text-[10px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">QaytarMe v2.5 Beta</p>
                </div>
             </div>

             {/* Right Content Area */}
             <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                   {activeSection === 'general' && (
                      <SettingSection key="general" title={t('settings_general_title')} description={t('settings_general_desc')}>
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                            label={t('settings_dark_mode')}
                            subLabel={isDarkMode ? t('settings_on') : t('settings_off')}
                            action={<Toggle active={isDarkMode} onChange={toggleTheme} />}
                         />
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
                            label={t('settings_language')}
                            subLabel={t('settings_language_desc')}
                            action={
                               <div className="flex gap-1 bg-neutral-100 dark:bg-black p-1 rounded-2xl">
                                  {['uz', 'ru', 'en', 'kk', 'ky', 'kaa'].map(l => (
                                    <button 
                                      key={l} 
                                      onClick={() => changeLanguage(l)} 
                                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${currentLanguage === l ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
                                    >
                                      {l}
                                    </button>
                                  ))}
                               </div>
                            }
                         />
                      </SettingSection>
                   )}

                   {activeSection === 'notifications' && (
                      <SettingSection key="notifications" title={t('settings_notif_title')} description={t('settings_notif_desc')}>
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                            label={t('settings_push')}
                            subLabel={t('settings_push_desc')}
                            action={<Toggle active={notifications.push} onChange={() => setNotifications({...notifications, push: !notifications.push})} />} 
                         />
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            label={t('settings_email')}
                            subLabel={t('settings_email_desc')}
                            action={<Toggle active={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} />} 
                         />
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            label={t('settings_smart')}
                            subLabel={t('settings_smart_desc')}
                            action={<Toggle active={notifications.matches} onChange={() => setNotifications({...notifications, matches: !notifications.matches})} />} 
                         />
                      </SettingSection>
                   )}

                   {activeSection === 'security' && (
                      <SettingSection key="security" title={t('settings_security_title')} description={t('settings_security_desc')}>
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                            label={t('settings_change_password')}
                            subLabel={t('settings_last_change')}
                            action={<button className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">{t('settings_update')}</button>} 
                         />
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                            label={t('settings_2fa')}
                            subLabel={t('settings_2fa_desc')}
                            action={<Toggle active={true} onChange={() => {}} />} 
                         />
                         
                         <div className="mt-8">
                            <OptionRow 
                               destructive
                               icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                               label={t('settings_delete_account')}
                               subLabel={t('settings_delete_warning')}
                               action={<button className="px-5 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">{t('settings_delete')}</button>} 
                            />
                         </div>
                      </SettingSection>
                   )}

                   {activeSection === 'support' && (
                      <SettingSection key="support" title={t('settings_support_title')} description={t('settings_support_desc')}>
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                            label={t('settings_telegram')}
                            subLabel={t('settings_247_support')}
                            action={<a href="#" className="text-blue-500 font-bold hover:underline">@qaytarme_support</a>} 
                         />
                         <OptionRow 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                            label={t('settings_call_center')}
                            subLabel={t('settings_work_hours')}
                            action={<a href="tel:+998901234567" className="font-black text-neutral-900 dark:text-white hover:text-mint transition-colors">+998 90 123 45 67</a>} 
                         />

                         {/* Direct Message Form */}
                         <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-white/5">
                            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-4">{t('settings_contact_admin')}</h3>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-100 dark:border-white/5">
                               <textarea 
                                  value={supportMessage}
                                  onChange={(e) => setSupportMessage(e.target.value)}
                                  placeholder={t('settings_message_placeholder')}
                                  className="w-full bg-white dark:bg-neutral-800 p-4 rounded-2xl resize-none min-h-[120px] outline-none border focus:border-mint transition-all dark:text-white"
                               />
                               <div className="flex justify-end mt-4">
                                  <button 
                                    onClick={handleSendMessage}
                                    disabled={isSending}
                                    className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg items-center flex gap-2"
                                  >
                                    {isSending ? (
                                      <>{t('settings_sending')}</>
                                    ) : (
                                      <>
                                        {t('settings_send')}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                      </>
                                    )}
                                  </button>
                               </div>
                            </div>
                         </div>
                      </SettingSection>
                   )}
                </AnimatePresence>
             </div>
          </div>
       </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <SettingsContent />
    </SnackbarProvider>
  );
}
