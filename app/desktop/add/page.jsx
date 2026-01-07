"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GOOGLE_MAPS_LIBRARIES } from "../../map-constants";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

// Dark Mode Map Styles
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  // ... (keep existing styles implicitly via ..., actual file content will handle this but for replacement stick to lines)
];

const CATEGORIES = [
  { id: "electronics", label: "Elektronika", icon: "📱" },
  { id: "documents", label: "Hujjatlar", icon: "📄" },
  { id: "personal", label: "Shaxsiy buyumlar", icon: "👜" },
  { id: "clothing", label: "Kiyim-kechak", icon: "👕" },
  { id: "accessories", label: "Aksessuarlar", icon: "⌚" },
  { id: "keys", label: "Kalitlar", icon: "🔑" },
  { id: "bags", label: "Sumkalar", icon: "🎒" },
  { id: "automotive", label: "Avtomobil buyumlari", icon: "🚗" },
  { id: "kids", label: "Bolalar buyumlari", icon: "🧸" },
  { id: "sports", label: "Sport anjomlari", icon: "⚽" },
  { id: "books", label: "Kitoblar", icon: "📚" },
  { id: "pets", label: "Uy hayvonlari", icon: "�" },
  { id: "other", label: "Boshqa", icon: "📦" }
];



export default function AddItemPage() {
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
        router.push("/desktop");
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
    <div className="min-h-screen bg-ivory dark:bg-black p-4 lg:p-8 flex items-start justify-center pt-4 lg:pt-8">
      <div className="w-full max-w-5xl mx-auto rounded-[2.5rem] bg-white dark:bg-[#111111] shadow-2xl shadow-neutral-200/50 dark:shadow-[0_0_50px_-5px_#A9D3C9] overflow-hidden flex flex-col md:flex-row min-h-[500px] h-auto border border-neutral-100 dark:border-white/5 transition-shadow duration-300">
        
        {/* Sidebar Steps (Desktop) / Top Progress (Mobile) */}
        <div className="w-full md:w-1/3 bg-neutral-50 dark:bg-black border-b md:border-b-0 md:border-r border-neutral-100 dark:border-white/5 p-8 flex flex-col">
          <Link href="/desktop" className="flex items-center gap-2 mb-10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-bold text-sm">{t("add_back")}</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">{t("add_title")}</h2>
            <div className="space-y-1">
              {STEPS.map((step, index) => (
                <div key={step.id} className="relative pl-8 py-2">
                  {/* Line */}
                  {index !== STEPS.length - 1 && (
                    <div className={`absolute left-[11px] top-8 bottom-[-8px] w-0.5 ${currentStep > step.id ? 'bg-mint' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
                  )}
                  {/* Dot */}
                  <div className={`absolute left-0 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                    currentStep === step.id 
                      ? 'border-mint bg-mint text-neutral-900' 
                      : currentStep > step.id 
                        ? 'border-mint bg-mint text-neutral-900' 
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-300'
                  }`}>
                    {currentStep > step.id ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-[10px] font-bold">{step.id}</span>
                    )}
                  </div>
                  
                  <div className={`transition-opacity duration-300 ${currentStep === step.id ? 'opacity-100' : 'opacity-50'}`}>
                    <h3 className={`text-sm font-bold ${currentStep === step.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>{step.title}</h3>
                    <p className="text-[10px] text-neutral-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 lg:p-12 relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 flex flex-col"
            >
              
              {/* STEP 1: Type Selection */}
              {currentStep === 1 && (
                <div className="my-auto space-y-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{t("add_step1_header")}</h2>
                    <p className="text-neutral-500">{t("add_step1_sub")}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setFormData({ ...formData, type: 'lost' })}
                      className={`relative p-8 rounded-3xl border-2 transition-all duration-300 group text-left ${
                        formData.type === 'lost' 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                          : 'border-neutral-100 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900/30 bg-white dark:bg-neutral-800'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-colors ${
                        formData.type === 'lost' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500 dark:bg-red-900/30'
                      }`}>
                        💔
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{t("add_lost")}</h3>
                      <p className="text-sm text-neutral-500">{t("add_lost_desc")}</p>
                      
                      {formData.type === 'lost' && (
                        <div className="absolute top-4 right-4 text-red-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, type: 'found' })}
                      className={`relative p-8 rounded-3xl border-2 transition-all duration-300 group text-left ${
                        formData.type === 'found' 
                          ? 'border-mint bg-mint/10' 
                          : 'border-neutral-100 dark:border-neutral-800 hover:border-mint/50 bg-white dark:bg-neutral-800'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-colors ${
                        formData.type === 'found' ? 'bg-mint text-neutral-900' : 'bg-[#A9D3C9]/30 text-[#2E2D2B] dark:text-white'
                      }`}>
                        🎁
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{t("add_found")}</h3>
                      <p className="text-sm text-neutral-500">{t("add_found_desc")}</p>

                      {formData.type === 'found' && (
                        <div className="absolute top-4 right-4 text-mint">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Category & Image */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{t("add_upload_title")}</h2>
                    <p className="text-neutral-500 text-sm">{t("add_upload_desc")}</p>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                    />
                    <div className={`w-full h-64 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-neutral-50 dark:bg-neutral-900 overflow-hidden ${
                      formData.imagePreview ? 'border-mint' : 'border-neutral-200 dark:border-neutral-700 hover:border-mint'
                    }`}>
                      {formData.imagePreview ? (
                        <div className="relative w-full h-full">
                          <img src={formData.imagePreview} className="w-full h-full object-contain" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <p className="text-white font-bold">{t("add_upload_change")}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4">📸</div>
                          <p className="text-neutral-500 font-medium">{t("add_upload_placeholder")}</p>
                          <p className="text-xs text-neutral-400 mt-2">{t("add_upload_click")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-4">{t("add_cat_title")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`px-4 py-3 rounded-xl text-sm font-bold flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 transition-all w-full text-center sm:text-left ${
                            formData.category === cat.id
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 scale-105 shadow-lg'
                              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-100 dark:border-white/5'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span>{t(`cat_${cat.id}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{t("add_details_title")}</h2>
                    <p className="text-neutral-500 text-sm">{t("add_details_desc")}</p>
                  </div>

                  <div className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_date")}</label>
                            <input 
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                                className="w-full h-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block ml-1">{t("add_label_phone")}</label>
                             <input 
                                type="tel" 
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                                placeholder="+998 90 123 45 67"
                                className="w-full h-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 font-bold text-neutral-900 dark:text-white outline-none focus:border-mint"
                             />
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Location */}
              {currentStep === 4 && (
                <div className="h-full flex flex-col">
                   <div className="mb-4">
                      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{t("add_loc_title")}</h2>
                      <p className="text-neutral-500 text-sm">{t("add_loc_desc")}</p>
                   </div>
                   <div className="flex-1 min-h-[400px] rounded-3xl overflow-hidden relative shadow-inner border border-neutral-100 dark:border-neutral-800">
                      {isLoaded ? (

                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={formData.location}
                            zoom={13}
                            onClick={handleMapClick}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            options={{
                              disableDefaultUI: true,
                              zoomControl: false,
                              mapTypeId: 'hybrid', // Satellite with labels
                              styles: isDarkMode ? darkMapStyles : []
                            }}
                          >
                             <Marker position={formData.location} />
                             
                             {/* Autocomplete Search */}
                             <div className="absolute top-4 left-4 right-4 z-[200]">
                                <Autocomplete
                                    onLoad={onAutocompleteLoad}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t("add_loc_search_placeholder")}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-white/10 shadow-lg text-sm font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-mint"
                                        />
                                    </div>
                                </Autocomplete>
                             </div>
                          </GoogleMap>
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                             <div className="animate-spin text-4xl">🌍</div>
                          </div>
                      )}
                      
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-4 rounded-xl shadow-lg z-[100]">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{t("add_loc_selected")}</p>
                          <p className="text-sm font-black text-neutral-900 dark:text-white line-clamp-2">{formData.address}</p>
                      </div>
                   </div>
                </div>
              )}

              {/* STEP 5: Review Step */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{t("add_review_title")}</h2>
                    <p className="text-neutral-500">{t("add_review_desc")}</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl space-y-4 border border-neutral-100 dark:border-white/5">
                      <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
                              {formData.imagePreview && <img src={formData.imagePreview} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 ${
                                  formData.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-mint text-neutral-900'
                              }`}>
                                  {formData.type === 'lost' ? t("add_lost") : t("add_found")}
                              </span>
                              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{formData.title}</h3>
                              <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{formData.description}</p>
                          </div>
                      </div>
                      
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-neutral-400 text-xs font-bold uppercase">{t("add_cat_title")}</p>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{CATEGORIES.find(c => c.id === formData.category) ? t(`cat_${formData.category}`) : ""}</p>
                          </div>
                          <div>
                              <p className="text-neutral-400 text-xs font-bold uppercase">{t("add_label_date")}</p>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{formData.date}</p>
                          </div>
                          <div className="col-span-2">
                              <p className="text-neutral-400 text-xs font-bold uppercase">{t("add_loc_selected")}</p>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{formData.address}</p>
                          </div>
                      </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Validation Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-20 left-12 right-12 bg-red-50 text-red-500 px-4 py-3 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               {error}
            </motion.div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-white/5">
             <button
               onClick={handleBack}
               disabled={currentStep === 1}
               className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                 currentStep === 1 
                   ? 'opacity-0 pointer-events-none' 
                   : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
               }`}
             >
               {t("back")}
             </button>

             {currentStep < STEPS.length ? (
                 <button
                 onClick={handleNext}
                 className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
               >
                 <span>{t("add_btn_next")}</span>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </button>
             ) : (
               <button
                 onClick={handleSubmit}
                 disabled={loading}
                 className="px-10 py-4 bg-mint text-neutral-900 rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-mint/20 flex items-center gap-2"
               >
                 {loading ? (
                   <>
                     <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                     <span>{t("add_btn_submitting")}</span>
                   </>
                 ) : (
                    <>
                      <span>{t("add_btn_submit")}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
