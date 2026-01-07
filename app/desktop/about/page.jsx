"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext"; // Import useLanguage

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const SectionCard = ({ children, className = "" }) => (
  <motion.div 
    variants={itemVariants}
    className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 lg:p-10 border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none hover:shadow-2xl transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

export default function AboutPage() {
  const { t } = useLanguage(); // Use hook
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [filesToUpload, setFilesToUpload] = useState({ founderImage: null, videoThumbnail: null });
  const [messageToAdmin, setMessageToAdmin] = useState("");

  const [videoData, setVideoData] = useState({
    title: "QaytarMe Loyihasi Tanishuvi", 
    desc: "Platformaning ishlash prinsipi va maqsadlari haqida qisqacha.",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "" // YouTube link
  });

  const [founder, setFounder] = useState({
      name: "Ismingiz Familiyangiz",
      role: "Full Stack Developer & UX/UI Designer",
      bio: "Men texnologiya orqali odamlar hayotini yengillashtirishga ishonaman. QaytarMe loyihasi - bu mening jamiyatga qo'shgan kichik hissam.",
      image: "https://avatars.githubusercontent.com/u/1234567?v=4",
      projects: [
          { id: 1, name: "EduPortal", desc: "Online ta'lim platformasi", icon: "📚", color: "orange", link: "https://google.com" },
          { id: 2, name: "EcoUz", desc: "Ekologik monitoring tizimi", icon: "🌱", color: "green", link: "https://google.com" }
      ]
  });

  useEffect(() => {
      const fetchData = async () => {
          try {
              const res = await fetch(getApiUrl('about'));
              if (res.ok) {
                  const data = await res.json();
                  if (data) {
                      if (data.founder) setFounder(data.founder);
                      if (data.videoData) setVideoData(data.videoData);
                  }
              }
          } catch (e) {
              console.error("Failed to load about data", e);
          }
      };
      fetchData();
  }, []);

  // Update default states if empty (optional, but good for i18n if user hasn't edited)
  useEffect(() => {
     if (videoData.title === "QaytarMe Loyihasi Tanishuvi") {
        setVideoData(prev => ({ ...prev, title: t('about_video_title'), desc: t('about_video_desc') }));
     }
  }, [t]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilesToUpload(prev => ({ ...prev, founderImage: file }));
      setFounder(prev => ({
        ...prev,
        image: URL.createObjectURL(file)
      }));
    }
  };

  const handleVideoThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilesToUpload(prev => ({ ...prev, videoThumbnail: file }));
      setVideoData(prev => ({
        ...prev,
        thumbnail: URL.createObjectURL(file)
      }));
    }
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const updateProject = (id, field, value) => {
    setFounder(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addProject = () => {
    setFounder(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now(), name: "Yangi Loyiha", desc: "Qisqacha tavsif", icon: "🚀", color: "blue", link: "https://google.com" }]
    }));
  };

  const removeProject = (id) => {
     setFounder(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  const handleSave = async () => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify({ founder, videoData }));
        
        if (filesToUpload.founderImage) {
            formData.append('founderImage', filesToUpload.founderImage);
        }
        if (filesToUpload.videoThumbnail) {
             formData.append('videoThumbnail', filesToUpload.videoThumbnail);
        }

        const res = await fetch(getApiUrl('about'), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session?.user?.accessToken}`
            },
            body: formData
        });

        if (!res.ok) throw new Error("Saqlashda xatolik");
        
        const newData = await res.json();
        if (newData.founder) setFounder(newData.founder);
        if (newData.videoData) setVideoData(newData.videoData);
        setFilesToUpload({ founderImage: null, videoThumbnail: null });
        
        setIsEditing(false);
        alert(t('about_save_success'));
    } catch (err) {
        console.error(err);
        alert(t('about_save_error') + ": " + err.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageToAdmin.trim()) return;
    try {
      const res = await fetch(getApiUrl('admin/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({ message: messageToAdmin })
      });
      if (res.ok) {
        setMessageToAdmin("");
        alert(t('about_contact_success'));
      } else {
        alert(t('about_contact_error'));
      }
    } catch (e) {
      alert("Xatolik yuz berdi"); // Fallback or add key
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen pb-24 space-y-8"
    >
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleImageUpload} 
         className="hidden" 
         accept="image/*"
      />
      <input 
         type="file" 
         ref={videoInputRef} 
         onChange={handleVideoThumbnailUpload} 
         className="hidden" 
         accept="image/*"
      />

      {/* Admin Floating Controls */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
           {isEditing && (
              <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-neutral-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
              >
                 <span className="text-sm font-bold">{t('about_edit_mode')}</span>
              </motion.div>
           )}
           
           <button 
             onClick={isEditing ? handleSave : () => setIsEditing(true)}
             className={`px-8 py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
               isEditing 
                 ? 'bg-mint text-neutral-900 shadow-mint/50' 
                 : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700'
             }`}
           >
             {isEditing ? (
                <>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                   <span>{t('about_save')}</span>
                </>
             ) : (
                <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   <span>{t('about_edit')}</span>
                </>
             )}
           </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative bg-neutral-900 dark:bg-white rounded-[3rem] p-10 lg:p-14 overflow-hidden shadow-2xl min-h-[300px] flex flex-col justify-center items-start text-left mb-12">
         {/* Animated Background */}
         <div className="absolute inset-0 overflow-hidden">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/4 animate-pulse duration-[4000ms]" />
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] opacity-40 translate-y-1/3 -translate-x-1/4 animate-pulse duration-[6000ms]" />
             <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
         </div>

         <div className="relative z-10 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white dark:text-neutral-900 text-xs font-black uppercase tracking-widest mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
              {t('about_label')}
            </motion.div>
            <h1 className="text-5xl lg:text-7xl font-black text-white dark:text-neutral-900 mb-6 tracking-tighter leading-tight">
              {t('about_hero_title_1')} <br />
              <span className="text-mint">{t('about_hero_title_2')}</span>
            </h1>
            <p className="text-lg text-neutral-400 dark:text-neutral-500 max-w-xl font-medium leading-relaxed">
              {t('about_hero_desc')}
            </p>
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Project Video & Goals */}
        <div className="lg:col-span-8 space-y-8">
           {/* Video Section */}
           <motion.div variants={itemVariants} className="bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative aspect-video group">
              {videoData.videoUrl && getYoutubeId(videoData.videoUrl) ? (
                  <>
                     <iframe 
                       className="w-full h-full absolute inset-0 z-10"
                       src={`https://www.youtube.com/embed/${getYoutubeId(videoData.videoUrl)}?autoplay=0`}
                       title="YouTube video player"
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                     ></iframe>
                     {/* Edit Controls Overlay for Video even if playing */}
                     {isEditing && (
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-black/80 z-30 transition-opacity opacity-0 group-hover:opacity-100">
                             <input 
                                value={videoData.videoUrl}
                                onChange={(e) => setVideoData({...videoData, videoUrl: e.target.value})}
                                className="bg-transparent border-b border-mint text-neutral-300 text-sm w-full outline-none placeholder-blue-400 font-mono mb-2"
                                placeholder="YouTube video linki (https://...)"
                            />
                        </div>
                     )}
                  </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 group-hover:bg-black/20 transition-all">
                    {!isEditing && (
                      <button className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all duration-300 group-hover:bg-mint group-hover:text-neutral-900 text-white">
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    )}
                    {isEditing && (
                        <div className="flex flex-col items-center gap-4 z-20 w-3/4 max-w-sm">
                           <input 
                                value={videoData.videoUrl || ''}
                                onChange={(e) => setVideoData({...videoData, videoUrl: e.target.value})}
                                className="bg-white/10 backdrop-blur border text-white text-sm w-full px-4 py-3 rounded-xl outline-none placeholder-white/50 border-white/20 focus:border-mint transition-colors text-center"
                                placeholder={t('about_video_link_placeholder')}
                            />
                            <div 
                                onClick={() => videoInputRef.current?.click()}
                                className="px-4 py-2 bg-white/10 backdrop-blur hover:bg-white/20 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors border border-white/20"
                            >
                                {t('about_cover_change')}
                            </div>
                        </div>
                    )}
                  </div>
                  <img src={videoData.thumbnail} className="w-full h-full object-cover opacity-80" alt="Video cover" />
                </>
              )}
              
              {/* Text Overlay (Only shows if no video playing OR in edit mode) */}
              {(!videoData.videoUrl || isEditing) && (
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20">
                      {isEditing ? (
                        <div className="space-y-4 pointer-events-auto">
                            {!videoData.videoUrl && (
                                <p className="text-xs text-mint font-bold uppercase tracking-widest text-center mb-4 animate-pulse">
                                    {t('about_video_no_link')}
                                </p>
                            )}
                            <input 
                                value={videoData.title}
                                onChange={(e) => setVideoData({...videoData, title: e.target.value})}
                                className="bg-transparent border-b border-mint text-white text-2xl font-black w-full outline-none placeholder-white/50 pb-2"
                                placeholder={t('about_video_placeholder_title')}
                            />
                            <textarea 
                                value={videoData.desc}
                                onChange={(e) => setVideoData({...videoData, desc: e.target.value})}
                                className="bg-transparent border-b border-mint text-neutral-300 text-sm w-full outline-none placeholder-neutral-400 resize-none h-16"
                                placeholder={t('about_video_placeholder_desc')}
                            />
                        </div>
                      ) : (
                        <>
                            <h3 className="text-white text-2xl font-black mb-1">{videoData.title}</h3>
                            <p className="text-neutral-300 text-sm">{videoData.desc}</p>
                        </>
                      )}
                  </div>
              )}
           </motion.div>

            {/* Goals & Future */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SectionCard>
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-3xl mb-6 text-blue-600">🎯</div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">{t('about_goal_title')}</h3>
                  <p className="text-neutral-500 font-medium leading-relaxed">
                     {t('about_goal_desc')}
                  </p>
               </SectionCard>
               <SectionCard>
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-3xl mb-6 text-purple-600">🚀</div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">{t('about_future_title')}</h3>
                  <ul className="space-y-3 text-neutral-500 font-medium">
                     <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"/> {t('about_future_1')}</li>
                     <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"/> {t('about_future_2')}</li>
                     <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"/> {t('about_future_3')}</li>
                     <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"/> {t('about_future_4')}</li>
                  </ul>
               </SectionCard>
            </div>
        </div>

        {/* Right Column: Founder Info */}
        <div className="lg:col-span-4 space-y-8">
           <SectionCard className="h-full flex flex-col bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-black relative group">
              
              <div className="mb-8 relative mx-auto">
                 <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-mint to-blue-500 relative z-10">
                    <img 
                      src={founder.image} 
                      className="w-full h-full rounded-full object-cover border-4 border-white dark:border-neutral-900"
                      alt="Founder"
                    />
                    {isEditing && (
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20 cursor-pointer hover:bg-black/60 transition-colors"
                       >
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       </div>
                    )}
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg z-20">
                    {t('about_founder_role')}
                 </div>
              </div>
              
              <div className="text-center mb-8">
                 {isEditing ? (
                    <input 
                      type="text" 
                      value={founder.name} 
                      onChange={(e) => setFounder({...founder, name: e.target.value})}
                      className="text-3xl font-black text-center bg-transparent border-b border-mint outline-none w-full mb-2 text-neutral-900 dark:text-white"
                      placeholder={t('about_founder_name_placeholder')}
                    />
                 ) : (
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{founder.name}</h2>
                 )}
                 
                 {isEditing ? (
                    <input 
                      type="text" 
                      value={founder.role} 
                      onChange={(e) => setFounder({...founder, role: e.target.value})}
                      className="text-xs font-bold text-center bg-transparent border-b border-mint outline-none w-full uppercase tracking-widest text-mint"
                      placeholder={t('about_founder_spec_placeholder')}
                    />
                 ) : (
                    <p className="text-mint font-bold uppercase tracking-widest text-xs">{founder.role}</p>
                 )}
              </div>

              <div className="space-y-6 mb-8 flex-1">
                 {isEditing ? (
                    <textarea 
                      value={founder.bio} 
                      onChange={(e) => setFounder({...founder, bio: e.target.value})}
                      className="w-full bg-transparent border border-mint rounded-xl p-3 text-sm min-h-[100px] outline-none text-neutral-500 dark:text-neutral-400 resize-none"
                      placeholder={t('about_founder_bio_placeholder')}
                    />
                 ) : (
                    <p className="text-center text-neutral-500 font-medium leading-relaxed">
                       {founder.bio}
                    </p>
                 )}
                 
                 <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
                    <h4 className="font-bold text-neutral-900 dark:text-white mb-3 text-sm uppercase text-center">{t('about_tech_title')}</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                       {['Next.js', 'React', 'Node.js', 'MongoDB', 'Tailwind', 'Framer Motion'].map(tech => (
                          <span key={tech} className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                             {tech}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                 <div className="flex items-center justify-between mb-4">
                     <h4 className="font-bold text-neutral-900 dark:text-white text-sm uppercase tracking-widest text-center flex-1">{t('about_other_projects')}</h4>
                     {isEditing && (
                        <button onClick={addProject} className="p-1 rounded-lg bg-mint text-neutral-900 hover:scale-110 transition-transform">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                     )}
                 </div>
                 
                 <div className="space-y-3">
                     {founder.projects.map((project) => (
                        <div key={project.id} className="relative group/item">
                            <a 
                                href={!isEditing ? (project.link || '#') : '#'}
                                target={!isEditing ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 transition-colors border border-neutral-100 dark:border-white/5 ${isEditing ? 'border-dashed' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                            >
                              <div className={`w-10 h-10 rounded-lg bg-${project.color}-100 dark:bg-${project.color}-900/30 flex items-center justify-center text-xl text-${project.color}-500 shrink-0`}>
                                  {isEditing ? (
                                      <input 
                                          value={project.icon} 
                                          onChange={(e) => updateProject(project.id, 'icon', e.target.value)}
                                          className="w-full h-full bg-transparent text-center outline-none" 
                                      />
                                  ) : project.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                      <>
                                          <input 
                                              value={project.name} 
                                              onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                                              className="font-bold text-neutral-900 dark:text-white bg-transparent border-b border-mint/50 w-full outline-none text-sm mb-1" 
                                              placeholder={t('about_project_name_placeholder')}
                                          />
                                          <input 
                                              value={project.desc} 
                                              onChange={(e) => updateProject(project.id, 'desc', e.target.value)}
                                              className="text-xs text-neutral-400 bg-transparent border-b border-mint/30 w-full outline-none" 
                                              placeholder={t('about_project_desc_placeholder')}
                                          />
                                          <input 
                                              value={project.link || ''} 
                                              onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                              className="text-[10px] text-blue-500 bg-transparent border-b border-mint/20 w-full outline-none mt-1" 
                                              placeholder="https://..."
                                          />
                                      </>
                                  ) : (
                                      <>
                                          <div className="font-bold text-neutral-900 dark:text-white group-hover:text-mint transition-colors">{project.name}</div>
                                          <div className="text-xs text-neutral-400">{project.desc}</div>
                                      </>
                                  )}
                              </div>
                            </a>
                            {isEditing && (
                                <button 
                                    onClick={() => removeProject(project.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                     ))}
                 </div>
              </div>
              


           </SectionCard>
        </div>

      </div>
    </motion.div>
  );
}
