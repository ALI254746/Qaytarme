"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "../../../map-constants";
import { useSession } from "next-auth/react";

const mapContainerStyle = { width: '100%', height: '100%' };

// Dark Mode Map Styles (reused)
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

export default function MobileItemDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

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

  const handleMessage = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/mobile/item/${params.id}`);
      return;
    }
    router.push(`/mobile/messages/${item.user._id}?itemId=${item._id}`);
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-white dark:bg-black p-4 space-y-6">
           <div className="h-64 w-full bg-neutral-100 dark:bg-neutral-900 rounded-3xl animate-pulse" />
           <div className="h-8 w-3/4 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
           <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
           </div>
        </div>
     );
  }

  if (error || !item) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-black">
         <div className="text-6xl mb-4">😕</div>
         <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{t('item_not_found') || "Hech narsa topilmadi"}</h2>
         <p className="text-neutral-500 mb-6">{error || t('no_data_available') || "Ma'lumot mavjud emas"}</p>
         <button onClick={() => router.back()} className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold">
            {t('btn_back') || "Orqaga qaytish"}
         </button>
      </div>
    );
  }

  const mapCenter = {
    lat: parseFloat(item.coordinates?.lat || 41.2995),
    lng: parseFloat(item.coordinates?.lng || 69.2401)
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-28 relative">
       
       {/* Top Navigation Overlay */}
       <div className="absolute top-4 left-4 z-20">
          <button onClick={() => router.back()} className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
       </div>

       {/* Full Height Image Slider */}
       <div className="h-[50vh] w-full relative bg-neutral-100 dark:bg-neutral-900">
          {item.image?.url || (typeof item.image === 'string' && item.image) ? (
             <img src={item.image?.url || item.image} alt="" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
          )}
          {/* Image Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
          
          {/* Title on Image */}
          <div className="absolute bottom-12 left-6 right-6 z-10">
             <div className="flex gap-2 mb-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${
                   item.status === 'lost' ? 'bg-red-500/90 text-white' : 'bg-mint/90 text-neutral-900'
                }`}>
                   {item.status === 'lost' ? (t('filter_lost') || "YO'QOLGAN") : (t('filter_found') || "TOPILGAN")}
                </span>
             </div>
             <h1 className="text-3xl font-black text-white leading-none shadow-black/50 drop-shadow-lg">{item.itemType}</h1>
          </div>
       </div>

       {/* Content Sheet */}
       <div className="-mt-8 relative z-10 bg-white dark:bg-black rounded-t-[2.5rem] px-6 pt-8 min-h-[50vh] shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)] border-t border-white/20">
          
          {/* Location & Date */}
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-6">
             <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             <span className="truncate max-w-[200px]">{item.location || `${item.region}, ${item.district}`}</span>
             <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-1" />
             <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Description */}
          <div className="mb-8">
             <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{t('label_description') || "Tavsif"}</h3>
             <p className="text-neutral-800 dark:text-neutral-300 leading-relaxed text-sm font-medium">
                {item.itemDescription || t('no_description_text') || "Tavsif mavjud emas."}
             </p>
          </div>

          {/* Author Card */}
          <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-white/5 mb-8">
             <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-800 overflow-hidden shadow-sm shrink-0">
                 {item.user?.avatar ? (
                    <img src={item.user.avatar} alt="" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">{item.user?.name?.charAt(0)}</div>
                 )}
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">{t('author_label') || "E'lon egasi"}</div>
                <div className="font-bold text-neutral-900 dark:text-white truncate">{item.user?.name || "Foydalanuvchi"}</div>
             </div>
          </div>

          {/* Map Preview */}
          <div className="h-48 w-full rounded-3xl overflow-hidden relative mb-8 border border-neutral-100 dark:border-white/5 bg-neutral-100 dark:bg-neutral-900">
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
                 <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs font-bold shadow-lg scale-95 group-hover:scale-110 transition-transform">
                    {t('open_map') || "Xaritani ochish 🗺️"}
                 </span>
              </a>
          </div>
       </div>

       {/* Sticky Bottom Actions Bar */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-neutral-100 dark:border-white/10 z-[60] flex gap-3 pb-8 safe-area-pb">
          <a href={`tel:${item.phone}`} className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl flex items-center justify-center gap-2 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
             {t('btn_call') || "Qo'ng'iroq"}
          </a>
          <button 
             onClick={handleMessage}
             className="flex-[2] py-4 bg-mint text-neutral-900 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-mint/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
             {t('btn_message') || "Xabar yozish"}
          </button>
       </div>
    </div>
  );
}
