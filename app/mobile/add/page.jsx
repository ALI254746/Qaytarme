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
         <div className="px-4 h-14 flex items-center justify-between">
            <button onClick={handleBack} className="p-2 -ml-2 text-neutral-500 active:text-neutral-900 dark:active:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-bold text-sm text-neutral-900 dark:text-white">{t("add_title")}</span>
            <span className="text-xs font-bold text-neutral-400">{currentStep}/5</span>
         </div>
         {/* Progress Bar */}
         <div className="fl-full h-1 bg-neutral-100 dark:bg-neutral-800">
            <div 
               className="h-full bg-mint transition-all duration-300 ease-out"
               style={{ width: `${(currentStep / 5) * 100}%` }}
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
                <div className="flex flex-col gap-4 mt-8">
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white">{t("add_step1_header")}</h2>
                  <p className="text-neutral-500 text-sm mb-4">{t("add_step1_sub")}</p>
                  
                  <button
                    onClick={() => setFormData({ ...formData, type: 'lost' })}
                    className={`relative p-6 rounded-3xl border-2 transition-all active:scale-95 text-left ${
                      formData.type === 'lost' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                        : 'border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            formData.type === 'lost' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500 dark:bg-red-900/30'
                        }`}>💔</div>
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{t("add_lost")}</h3>
                            <p className="text-xs text-neutral-500">{t("add_lost_desc")}</p>
                        </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, type: 'found' })}
                    className={`relative p-6 rounded-3xl border-2 transition-all active:scale-95 text-left ${
                      formData.type === 'found' 
                        ? 'border-mint bg-mint/10' 
                        : 'border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            formData.type === 'found' ? 'bg-mint text-neutral-900' : 'bg-[#A9D3C9]/30 text-[#2E2D2B] dark:text-white'
                        }`}>🎁</div>
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{t("add_found")}</h3>
                            <p className="text-xs text-neutral-500">{t("add_found_desc")}</p>
                        </div>
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 2: Category & Image */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-6">
                  {/* Image Upload */}
                  <div className="relative aspect-square w-full rounded-3xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 z-10" 
                      />
                      {formData.imagePreview ? (
                         <img src={formData.imagePreview} className="w-full h-full object-cover" />
                      ) : (
                         <div className="text-center p-4">
                            <div className="text-4xl mb-2">📸</div>
                            <p className="font-bold text-sm text-neutral-500">{t("add_upload_title")}</p>
                            <span className="text-xs text-mint font-bold uppercase mt-1 inline-block">{t("add_upload_click")}</span>
                         </div>
                      )}
                  </div>

                  {/* Categories Grid */}
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-3 text-sm uppercase tracking-wider">{t("add_cat_title")}</h3>
                    <div className="grid grid-cols-3 gap-2">
                       {CATEGORIES.map(cat => (
                         <button
                           key={cat.id}
                           onClick={() => setFormData({ ...formData, category: cat.id })}
                           className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                              formData.category === cat.id
                                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                                : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-100 dark:border-white/5'
                           }`}
                         >
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="text-[9px] font-bold text-center leading-tight">{t(`cat_${cat.id}`)}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-4">
                    <div>
                         <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_title")}</label>
                         <input 
                            type="text" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder={t("add_placeholder_title")}
                            className="w-full h-14 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint transition-colors placeholder:text-neutral-400"
                         />
                    </div>
                    
                    <div>
                         <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_desc")}</label>
                         <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder={t("add_placeholder_desc")}
                            className="w-full h-32 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 font-medium text-neutral-900 dark:text-white outline-none focus:border-mint transition-colors placeholder:text-neutral-400 resize-none"
                         />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_date")}</label>
                        <input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})} 
                            className="w-full h-14 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint"
                        />
                    </div>

                    <div>
                         <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_phone")}</label>
                         <input 
                            type="tel" 
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                            placeholder="+998 90 123 45 67"
                            className="w-full h-14 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint"
                         />
                    </div>

                    <div>
                         <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">Telegram</label>
                         <input 
                            type="text" 
                            value={formData.telegram}
                            onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                            placeholder="@username"
                            className="w-full h-14 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint"
                         />
                    </div>
                </div>
              )}

              {/* STEP 4: Location */}
              {currentStep === 4 && (
                <div className="flex flex-col h-[70vh] -mx-4">
                   <div className="relative flex-1 bg-neutral-100 dark:bg-neutral-900">
                       {isLoaded ? (
                          <GoogleMap
                             mapContainerStyle={mapContainerStyle}
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

                       <div className="absolute bottom-6 left-4 right-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl z-10 border border-neutral-100 dark:border-white/5">
                           <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{t('add_review_location_label')}</p>
                           <p className="text-sm font-black text-neutral-900 dark:text-white leading-tight">{formData.address}</p>
                       </div>
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

          {/* Floating Action Button */}
          <div className="fixed bottom-24 left-4 right-4 z-50">
             {error && (
                <div className="mb-4 bg-red-500 text-white p-3 rounded-xl text-xs font-bold shadow-lg animate-bounce">
                    {error}
                </div>
             )}
             
             <button
               onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
               className={`w-full py-4 rounded-2xl font-black text-center shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                  currentStep === STEPS.length 
                  ? 'bg-mint text-neutral-900'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
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
