"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/api-config";

// Reusable Section Component
const InfoCard = ({ title, children, icon }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
    <div className="flex items-center gap-3 mb-3">
        {icon && <div className="text-2xl">{icon}</div>}
        <h3 className="font-bold text-neutral-900 dark:text-white text-base">{title}</h3>
    </div>
    <div className="text-sm text-neutral-500 font-medium leading-relaxed">
      {children}
    </div>
  </div>
);

export default function MobileAboutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [founder, setFounder] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(getApiUrl('about'));
        if (res.ok) {
          const data = await res.json();
          setFounder(data.founder);
          setVideoData(data.videoData);
        }
      } catch (e) {
        console.error("Failed to load about data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const founderImage = founder?.image || "https://avatars.githubusercontent.com/u/1234567?v=4";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-safe">
      {/* Native-like Header */}
      <div className="bg-white dark:bg-neutral-900 px-4 pt-4 pb-4 border-b border-neutral-100 dark:border-white/5 sticky top-0 z-20 flex items-center gap-3 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-white active:scale-90 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{t('about_us_mobile_title') || "Loyiha haqida"}</h1>
      </div>

      <div className="p-4 space-y-6">
         
         {/* Video Section */}
         <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-lg relative group">
            {videoData?.videoUrl && getYoutubeId(videoData.videoUrl) ? (
               <iframe 
                 className="w-full h-full"
                 src={`https://www.youtube.com/embed/${getYoutubeId(videoData.videoUrl)}`}
                 title="Project Video"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                    <img src={videoData?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"} className="w-full h-full object-cover opacity-60" alt="Cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                <h3 className="text-white font-bold text-sm line-clamp-1">{videoData?.title || t('about_video_default_title')}</h3>
            </div>
         </div>

         {/* Goals */}
         <div className="space-y-4">
            <InfoCard title={t('about_goal_title') || "Maqsadimiz"} icon="🎯">
               {t('about_goal_desc') || "Odamlarga yo'qolgan buyumlarini topishda yordam berish va jamiyatda o'zaro ishonchni mustahkamlash."}
            </InfoCard>
            
            <InfoCard title={t('about_future_title') || "Kelajak rejalari"} icon="🚀">
               <ul className="space-y-2 mt-1">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mint"/> {t('about_future_1') || "Mobile ilova yaratish"}</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mint"/> {t('about_future_2') || "Sun'iy intellekt qo'shish"}</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mint"/> {t('about_future_3') || "Xalqaro bozorga chiqish"}</li>
               </ul>
            </InfoCard>
         </div>

         {/* Founder Section */}
         <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-neutral-50 to-transparent dark:from-neutral-800/50" />
             
             <div className="relative z-10">
                 <div className="w-24 h-24 mx-auto rounded-full p-1 bg-mint shadow-xl mb-4">
                     <img src={founderImage} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-900" alt="Founder" />
                 </div>
                 
                 <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-1">
                     {founder?.name || "Ismingiz Familiyangiz"}
                 </h2>
                 <p className="text-xs font-bold text-mint uppercase tracking-widest mb-4">
                     {founder?.role || "Full Stack Developer"}
                 </p>
                 
                 <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                     {founder?.bio || "Men texnologiya orqali odamlar hayotini yengillashtirishga ishonaman. QaytarMe loyihasi - bu mening jamiyatga qo'shgan kichik hissam."}
                 </p>

                 {/* Tech Stack Chips */}
                 <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {['Next.js', 'React', 'Node.js', 'MongoDB', 'Tailwind'].map(tech => (
                        <span key={tech} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-500 dark:text-neutral-400">
                            {tech}
                        </span>
                    ))}
                 </div>

                 {/* Other Projects */}
                 <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                     <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">{t('about_other_projects') || "Boshqa loyihalar"}</h4>
                     <div className="space-y-3">
                         {founder?.projects?.map(project => (
                             <a 
                                 href={project.link || '#'} 
                                 target="_blank" 
                                 key={project.id}
                                 className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 transition-colors text-left"
                             >
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${project.color || 'blue'}-100 dark:bg-${project.color || 'blue'}-900/30 text-${project.color || 'blue'}-500`}>
                                     {project.icon || '🚀'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">{project.name}</div>
                                     <div className="text-xs text-neutral-500 truncate">{project.desc}</div>
                                 </div>
                                 <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                             </a>
                         ))}
                         {(!founder?.projects || founder.projects.length === 0) && (
                            <p className="text-xs text-neutral-400">Hozircha boshqa loyihalar yo'q</p>
                         )}
                     </div>
                 </div>
             </div>
         </div>

         <div className="text-center pb-8">
             <p className="text-[10px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">
                 Designed & Built with ❤️ by {founder?.name?.split(' ')[0] || 'Us'}
             </p>
         </div>

      </div>
    </div>
  );
}
