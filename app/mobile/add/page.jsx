"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "../../map-constants";

// Map container style for mobile
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Dark Mode Map Styles
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
];

const CATEGORIES = [
  { id: "electronics", label: "Elektronika", icon: "📱" },
  { id: "documents", label: "Hujjatlar", icon: "📄" },
  { id: "personal", label: "Shaxsiy buyumlar", icon: "👜" },
  { id: "clothing", label: "Kiyim-kechak", icon: "👕" },
  { id: "accessories", label: "Aksessuarlar", icon: "⌚" },
  { id: "keys", label: "Kalitlar", icon: "🔑" },
  { id: "bags", label: "Sumkalar", icon: "🎒" },
  { id: "automotive", label: "Avtomobil", icon: "🚗" },
  { id: "kids", label: "Bolalar", icon: "🧸" },
  { id: "sports", label: "Sport", icon: "⚽" },
  { id: "books", label: "Kitoblar", icon: "📚" },
  { id: "pets", label: "Uy hayvonlari", icon: "🐶" },
  { id: "other", label: "Boshqa", icon: "📦" }
];

export default function MobileAddItemPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  
  const STEPS = [
    { id: 1, title: t("add_step_1_title"), desc: t("add_step_1_desc") },
    { id: 2, title: t("add_step_2_title"), desc: t("add_step_2_desc") },
    { id: 3, title: t("add_step_3_title"), desc: t("add_step_3_desc") },
    { id: 4, title: t("add_step_4_title"), desc: t("add_step_4_desc") },
    { id: 5, title: t("add_step_5_title"), desc: t("add_step_5_desc") }
  ];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", 
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const mapRef = useRef(null);
  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);
  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        
        setFormData(prev => ({ 
            ...prev, 
            location: newPos,
            address: place.formatted_address || prev.address 
        }));
        
        if (mapRef.current) {
            mapRef.current.panTo(newPos);
            mapRef.current.setZoom(15);
        }
      }
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    type: "", // 'lost' or 'found'
    category: "",
    image: null,
    imagePreview: null,
    title: "",
    description: "",
    location: { lat: 41.2995, lng: 69.2401 }, // Tashkent default
    address: "Toshkent",
    contactPhone: "",
    telegram: "",
    date: new Date().toISOString().split('T')[0]
  });

   // Auto Geolocation
   useEffect(() => {
    if (currentStep === 4 && navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
         (position) => {
            const { latitude, longitude } = position.coords;
            const userPos = { lat: latitude, lng: longitude };
            setFormData(prev => ({ ...prev, location: userPos }));
            if (mapRef.current) {
                mapRef.current.panTo(userPos);
                mapRef.current.setZoom(15);
            }
            fetchAddress(latitude, longitude);
         },
         (error) => console.log("Geolocation error:", error),
         { enableHighAccuracy: true }
       );
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Validation logic
      if (currentStep === 1 && !formData.type) return setError(t("add_error_step1"));
      if (currentStep === 2 && (!formData.category || !formData.image)) return setError(t("add_error_step2"));
      if (currentStep === 3 && (!formData.title || !formData.description || !formData.contactPhone)) return setError(t("add_error_step3"));
      
      setError("");
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else router.back();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setFormData(prev => ({ ...prev, address: data.display_name }));
    } catch (e) {
      console.error("Address fetch error", e);
    }
  };

  const handleMapClick = (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setFormData(prev => ({ ...prev, location: { lat, lng } }));
      fetchAddress(lat, lng);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("status", formData.type);
      data.append("category", formData.category);
      data.append("title", formData.title); 
      data.append("itemType", formData.title); 
      data.append("description", formData.description);
      data.append("itemDescription", formData.description);
      data.append("location", formData.address);
      data.append("coordinates", JSON.stringify(formData.location));
      data.append("date", formData.date);
      data.append("phone", formData.contactPhone);
      data.append("telegram", formData.telegram);
      if (formData.image) {
        data.append("image", formData.image);
      }

      const res = await fetch(getApiUrl("ariza"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.user?.accessToken}`
        },
        body: data
      });

        if (res.ok) {
        router.push("/mobile");
      } else {
        const errData = await res.json();
        throw new Error(errData.message || t("error_generic") || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24">
      
      {/* Top Header & Progress */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5">
         <div className="px-4 h-12 flex items-center justify-between">
            <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center -ml-2 text-neutral-500 active:text-neutral-900 dark:active:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{STEPS[currentStep-1].title}</span>
            <span className="text-xs font-bold text-neutral-400">{currentStep}/5</span>
         </div>
         <div className="w-full h-0.5 bg-neutral-100 dark:bg-neutral-800">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(currentStep / 5) * 100}%` }}
               transition={{ duration: 0.3 }}
               className="h-full bg-neutral-900 dark:bg-white"
            />
         </div>
      </div>

      <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-6 min-h-[60vh]"
            >
              
              {/* STEP 1: Type Selection */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="px-1 mb-2">
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">E'lon turi</h2>
                      <p className="text-neutral-500 text-xs">Mavjud variantlardan birini tanlang</p>
                  </div>
                  
                  <div className="space-y-2">
                      <button
                        onClick={() => setFormData({ ...formData, type: 'lost' })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${
                          formData.type === 'lost' 
                            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black' 
                            : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-200 dark:border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">💔</div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-sm">Yo'qotdim</h3>
                            <p className="text-[10px] text-neutral-500 font-medium">Shaxsiy buyum yo'qolganda</p>
                        </div>
                        {formData.type === 'lost' && <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>

                      <button
                        onClick={() => setFormData({ ...formData, type: 'found' })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${
                          formData.type === 'found' 
                            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black' 
                            : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-200 dark:border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">🎁</div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-sm">Topib oldim</h3>
                            <p className="text-[10px] text-neutral-500 font-medium">Birovning buyumi topilganda</p>
                        </div>
                        {formData.type === 'found' && <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Category & Image */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  {/* Compact Image Upload */}
                  <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
                          />
                          {formData.imagePreview ? (
                             <img src={formData.imagePreview} className="w-full h-full object-cover" />
                          ) : (
                             <span className="text-2xl">📷</span>
                          )}
                      </div>
                      <div>
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Rasm yuklash</h3>
                          <p className="text-xs text-neutral-500 mt-1">Sifatli rasm yuklang</p>
                          <span className="text-[10px] font-bold text-mint uppercase mt-1 inline-block">Tanlash</span>
                      </div>
                  </div>

                  {/* Categories Grid (Small) */}
                  <div>
                    <h3 className="font-bold text-sm mb-2 text-neutral-900 dark:text-white">Kategoriya</h3>
                    <div className="grid grid-cols-4 gap-2">
                       {CATEGORIES.map(cat => (
                         <button
                           key={cat.id}
                           onClick={() => setFormData({ ...formData, category: cat.id })}
                           className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border aspect-square ${
                              formData.category === cat.id
                                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                                : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-white/10'
                           }`}
                         >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-[9px] font-bold text-center truncate w-full">{t(`cat_${cat.id}`)}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-3">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="border-b border-neutral-100 dark:border-white/5 px-4 py-2">
                             <label className="text-[10px] font-bold uppercase text-neutral-400 block">{t("add_label_title")}</label>
                             <input 
                                type="text" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder={t("add_placeholder_title")}
                                className="w-full h-8 bg-transparent font-semibold text-sm text-neutral-900 dark:text-white outline-none placeholder:text-neutral-300"
                             />
                        </div>
                        <div className="px-4 py-2">
                             <label className="text-[10px] font-bold uppercase text-neutral-400 block">{t("add_label_desc")}</label>
                             <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={t("add_placeholder_desc")}
                                className="w-full h-20 bg-transparent font-medium text-sm text-neutral-900 dark:text-white outline-none placeholder:text-neutral-300 resize-none py-1"
                             />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="border-b border-neutral-100 dark:border-white/5 px-4 py-2 flex items-center justify-between">
                             <label className="text-[10px] font-bold uppercase text-neutral-400">{t("add_label_date")}</label>
                             <input 
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                                className="h-8 bg-transparent font-semibold text-sm text-neutral-900 dark:text-white outline-none text-right"
                             />
                        </div>
                        <div className="border-b border-neutral-100 dark:border-white/5 px-4 py-2">
                             <label className="text-[10px] font-bold uppercase text-neutral-400 block">{t("add_label_phone")}</label>
                             <input 
                                type="tel" 
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                                placeholder="+998 90 123 45 67"
                                className="w-full h-8 bg-transparent font-semibold text-sm text-neutral-900 dark:text-white outline-none placeholder:text-neutral-300"
                             />
                        </div>
                        <div className="px-4 py-2">
                             <label className="text-[10px] font-bold uppercase text-neutral-400 block">Telegram</label>
                             <input 
                                type="text" 
                                value={formData.telegram}
                                onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                                placeholder="@username"
                                className="w-full h-8 bg-transparent font-semibold text-sm text-neutral-900 dark:text-white outline-none placeholder:text-neutral-300"
                             />
                        </div>
                    </div>
                </div>
              )}

              {/* STEP 4: Location */}
              {currentStep === 4 && (
                <div className="absolute inset-x-0 bottom-0 top-32 z-0 bg-neutral-100 dark:bg-neutral-900">
                       {isLoaded ? (
                          <GoogleMap
                             mapContainerStyle={{ width: '100%', height: '100%' }}
                             center={formData.location}
                             zoom={15}
                             onClick={handleMapClick}
                             onLoad={onLoad}
                             onUnmount={onUnmount}
                             options={{
                                disableDefaultUI: true,
                                zoomControl: false,
                                mapTypeId: 'roadmap',
                                styles: isDarkMode ? darkMapStyles : []
                             }}
                          >
                             <Marker position={formData.location} />

                             <div className="absolute top-4 left-4 right-4 z-[20]">
                                <Autocomplete
                                    onLoad={onAutocompleteLoad}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <input
                                        type="text"
                                        placeholder={t("add_loc_search_placeholder")}
                                        className="w-full pl-4 pr-4 py-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-white/10 shadow-lg text-sm font-bold text-neutral-900 dark:text-white outline-none"
                                    />
                                </Autocomplete>
                             </div>
                          </GoogleMap>
                       ) : (
                          <div className="flex items-center justify-center h-full">{t('add_map_loading')}</div>
                       )}

                       <div className="absolute bottom-24 left-4 right-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl z-10 border border-neutral-100 dark:border-white/5">
                           <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{t('add_review_location_label')}</p>
                           <p className="text-xs font-black text-neutral-900 dark:text-white leading-tight line-clamp-2">{formData.address}</p>
                       </div>
                </div>
              )}

              {/* STEP 5: Review */}
              {currentStep === 5 && (
                 <div className="flex flex-col gap-6 ">
                     <div className="bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] p-6 border border-neutral-100 dark:border-white/5 shadow-sm">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-white">
                           {formData.imagePreview && <img src={formData.imagePreview} className="w-full h-full object-cover" />}
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                formData.type === 'lost' ? 'bg-red-500 text-white' : 'bg-mint text-neutral-900'
                            }`}>
                                {formData.type === 'lost' ? t('add_lost') : t('add_found')}
                            </span>
                            <span className="text-xs font-bold text-neutral-400">{formData.date}</span>
                        </div>

                        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2">{formData.title}</h2>
                        <p className="text-sm text-neutral-500 mb-4">{formData.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                             <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">{t('add_review_category')}</p>
                                <p className="text-sm font-bold">{t(`cat_${formData.category}`)}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">{t('add_review_contact')}</p>
                                <p className="text-sm font-bold">{formData.contactPhone}</p>
                                {formData.telegram && <p className="text-xs text-neutral-500 mt-0.5">{formData.telegram}</p>}
                             </div>
                             <div className="col-span-2">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">{t('add_review_address')}</p>
                                <p className="text-sm font-bold truncate">{formData.address}</p>
                             </div>
                        </div>
                     </div>
                 </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Floating Action Button (Compact) */}
          <div className="fixed bottom-24 left-4 right-4 z-50">
             {error && (
                <div className="mb-2 bg-red-500 text-white p-2 rounded-lg text-xs font-bold shadow-lg animate-bounce text-center">
                    {error}
                </div>
             )}
             
             <button
               onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
               className={`w-full h-12 rounded-xl font-bold text-sm text-center shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                  currentStep === STEPS.length 
                  ? 'bg-mint text-neutral-900 border border-mint'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-transparent'
               }`}
             >
                {currentStep === STEPS.length ? (
                   loading ? t("add_btn_submitting") : t("add_btn_submit")
                ) : (
                   <>
                      {t("add_btn_next")}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </>
                )}
             </button>
          </div>
      </div>
    </div>
  );
}
