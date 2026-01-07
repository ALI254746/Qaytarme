"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import ItemDetailsLoading from "./loading"; 
import { useTheme } from "@/context/ThemeContext";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Dark Mode Map Styles
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

import { GOOGLE_MAPS_LIBRARIES } from "../../../map-constants";

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(getApiUrl(`ariza/${params.id}`));
        if (!res.ok) throw new Error("E'lon topilmadi");
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [params.id]);

  if (loading) {
     return <ItemDetailsLoading />;
  }

  if (error || !item) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-neutral-900">
         <div className="text-6xl mb-4">😕</div>
         <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Hech narsa topilmadi</h2>
         <p className="text-neutral-500 mb-6">{error || "Ma'lumot mavjud emas"}</p>
         <button onClick={() => router.back()} className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold">Orqaga qaytish</button>
      </div>
    );
  }

  const mapCenter = {
    lat: parseFloat(item.coordinates?.lat || 41.2995),
    lng: parseFloat(item.coordinates?.lng || 69.2401)
  };

  // --- MOBILE LAYOUT ---
  if (isMobile) {
     return (
        <div className="min-h-screen bg-white dark:bg-neutral-900 pb-28 relative">
           
           {/* Top Navigation Overlay */}
           <div className="absolute top-4 left-4 z-20">
              <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
           </div>

           {/* Full Height Image Slider */}
           <div className="h-[45vh] w-full relative bg-neutral-100 dark:bg-neutral-800">
              {item.image?.url || (typeof item.image === 'string' && item.image) ? (
                 <img src={item.image?.url || item.image} alt="" className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
              )}
              {/* Image Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
           </div>

           {/* Content Sheet */}
           <div className="-mt-10 relative z-10 bg-white dark:bg-neutral-900 rounded-t-[2.5rem] px-6 pt-8 min-h-[50vh] shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)]">
              
              {/* Type & Status Pill */}
              <div className="flex items-center justify-between mb-4">
                 <span className="px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    {item.itemType}
                 </span>
                 <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'lost' ? 'bg-red-100 text-red-600' : 'bg-mint/20 text-mint'}`}>
                    {item.status === 'lost' ? "Yo'qolgan" : "Topilgan"}
                 </span>
              </div>

              {/* Title & Location */}
              <div className="mb-8">
                 <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2 leading-tight">{item.itemType}</h1>
                 <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                    <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {item.location || `${item.region}, ${item.district}`}
                    <span className="w-1 h-1 rounded-full bg-neutral-300 mx-1" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                 </div>
              </div>

              {/* Description */}
              <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                 <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Tavsif</h3>
                 <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                    {item.itemDescription || "Tavsif mavjud emas."}
                 </p>
              </div>

              {/* Author Card */}
              <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-700 overflow-hidden shadow-sm">
                     {item.user?.avatar ? (
                        <img src={item.user.avatar} alt="" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">{item.user?.name?.charAt(0)}</div>
                     )}
                 </div>
                 <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">E'lon egasi</div>
                    <div className="font-bold text-neutral-900 dark:text-white">{item.user?.name || "Foydalanuvchi"}</div>
                 </div>
              </div>

              {/* Map Preview */}
              <div className="h-48 w-full rounded-3xl overflow-hidden relative mb-8 border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                  {isLoaded && item.coordinates?.lat && item.coordinates?.lng ? (
                     <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={15}
                        options={{
                           disableDefaultUI: true,
                           zoomControl: false,
                           draggable: false,
                           styles: isDarkMode ? darkMapStyles : []
                        }}
                     >
                        <Marker position={mapCenter} />
                     </GoogleMap>
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl">🌍</div>
                  )}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`} 
                    target="_blank" 
                    className="absolute inset-0 z-[500] flex items-center justify-center bg-black/5 hover:bg-black/10 transition-all group"
                  >
                     <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs font-bold shadow-lg group-hover:scale-110 transition-transform">Xaritani ochish 🗺️</span>
                  </a>
              </div>
           </div>

           {/* Sticky Bottom Actions Bar */}
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 z-50 flex gap-3 pb-8">
              <a href={`tel:${item.phone}`} className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center gap-2 text-neutral-900 dark:text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 Qo'ng'iroq
              </a>
              <button 
                 onClick={() => router.push(`/desktop/messages?userId=${item.user._id}&itemId=${item._id}`)}
                 className="flex-[2] py-4 bg-mint text-neutral-900 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider shadow-lg shadow-mint/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                 Xabar yozish
              </button>
           </div>
        </div>
     );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-8 py-8 animate-in fade-in duration-500">
      {/* Navigation */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-neutral-900 rounded-2xl text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-100 dark:border-neutral-800 hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="uppercase tracking-widest text-xs">Orqaga</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left: Main Details */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="aspect-video rounded-[2.5rem] overflow-hidden relative group shadow-2xl shadow-neutral-200/50 dark:shadow-none bg-neutral-100 dark:bg-neutral-800"
          >
             {item.image?.url || (typeof item.image === 'string' && item.image) ? (
                <img src={item.image?.url || item.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             ) : (
                <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-4xl">📷</div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
             <div className="absolute bottom-0 left-0 p-10 text-white w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex gap-3 mb-4">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'lost' ? 'bg-red-500 text-white' : 'bg-mint text-neutral-900'}`}>{item.status === 'found' ? 'Topildi' : 'Yo\'qolgan'}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">{item.itemType}</h1>
                    <p className="text-white/80 font-medium flex items-center gap-2">
                       <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       {item.location}
                    </p>
                  </div>
                  <div className="hidden md:block">
                     <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <span className="text-2xl">{item.categoryIcon || "📦"}</span>
                     </div>
                  </div>
                </div>
             </div>
          </motion.div>

          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/30 dark:shadow-none hover:shadow-2xl transition-shadow">
             <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Batafsil ma'lumot</h3>
             <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg">{item.itemDescription || "Izoh qoldirilmagan."}</p>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           {/* Author Card */}
           <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/30 dark:shadow-none">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200 dark:border-neutral-700">
                     {item.user?.avatar ? <img src={item.user.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400 text-xl">{item.user?.name?.[0]}</div>}
                  </div>
                  <div>
                     <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">E'lon egasi</div>
                     <div className="text-xl font-black text-neutral-900 dark:text-white line-clamp-1">{item.user?.name}</div>
                  </div>
               </div>
               <div className="space-y-3">
                  <a href={`tel:${item.phone}`} className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-900 dark:text-white">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     Tel: {item.phone}
                  </a>
                  <button onClick={() => router.push(`/desktop/messages?userId=${item.user._id}&itemId=${item._id}`)} className="w-full py-4 bg-mint text-neutral-900 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-mint/20">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                     Xabar yozish
                  </button>
               </div>
           </div>

           {/* Map Widget */}
           <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-3 border border-neutral-100 dark:border-neutral-800 h-72 shadow-xl shadow-neutral-100/30 dark:shadow-none group">
               <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-neutral-100 dark:bg-neutral-800">
                  {isLoaded && item.coordinates?.lat && item.coordinates?.lng ? (
                     <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={14}
                        options={{
                           disableDefaultUI: true,
                           zoomControl: false,
                           draggable: false,
                           styles: isDarkMode ? darkMapStyles : []
                        }}
                     >
                        <Marker position={mapCenter} />
                     </GoogleMap>
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl">🌍</div>
                  )}
                  <a 
                     href={`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`} 
                     target="_blank" 
                     className="absolute inset-0 z-[500] flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                     <span className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xl scale-90 group-hover:scale-110 transition-transform">Xaritada ochish ↗</span>
                  </a>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}
