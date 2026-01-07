"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "../../map-constants";

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Tashkent)
const defaultCenter = {
  lat: 41.2995,
  lng: 69.2401
};

// Dark Mode Map Styles
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  // ... (Full styles can be added later or imported if kept in a separate file)
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

export default function MobileMapPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", 
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter); 
  const [activeFilter, setActiveFilter] = useState("all"); // all, lost, found
  const [showSearch, setShowSearch] = useState(true);

  const [mapType, setMapType] = useState('roadmap'); // roadmap, hybrid
  const mapRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  // Fetch Items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(getApiUrl("ariza?limit=1000"), { cache: 'no-store' }); 
        if (res.ok) {
           const data = await res.json();
           let itemsArray = Array.isArray(data) ? data : (data.items || data.arizalar || data.data || []);
           
           // Filter valid coords
           const validItems = itemsArray.filter(item => item.coordinates?.lat && item.coordinates?.lng);
           setItems(validItems);
        }
      } catch (error) {
        console.error("Map fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Filter Logic
  const filteredItems = items.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
    const searchLower = searchQuery.toLowerCase();
    const itemType = (item.itemType || "").toLowerCase();
    const location = (item.location || "").toLowerCase();
    
    const matchesSearch = itemType.includes(searchLower) || location.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  // Handle Marker Click
  const handleMarkerClick = (item) => {
    setSelectedItem(item);
    setMapCenter({ lat: parseFloat(item.coordinates.lat), lng: parseFloat(item.coordinates.lng) });
    setShowSearch(false); // Hide search to show details better
  };

  // Handle User Location
  const handleLocateMe = () => {
     if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
           (position) => {
              const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
              setMapCenter(pos);
              mapRef.current?.panTo(pos);
              mapRef.current?.setZoom(15);
           },
           () => alert(t('map_locate_error'))
        );
     }
  };

  if (loadError) return <div className="flex items-center justify-center h-screen bg-black text-white">{t('map_load_error')}</div>;

  return (
    <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden bg-neutral-100 dark:bg-black rounded-[2.5rem] shadow-2xl border border-neutral-200 dark:border-white/10">
        
       {/* --- Top Search Bar (Floating) --- */}
       <AnimatePresence>
          {showSearch && (
             <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-4 left-4 right-4 z-[10] space-y-3"
             >
                {/* Search Input */}
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-lg rounded-2xl flex items-center p-3 gap-3 border border-neutral-200 dark:border-white/10">
                   <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("mobile_search_placeholder")} 
                      className="flex-1 bg-transparent outline-none font-bold text-sm text-neutral-900 dark:text-white"
                   />
                </div>

                {/* Filter Pills */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'lost', 'found'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-lg transition-transform active:scale-95 ${
                                activeFilter === f 
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' 
                                : 'bg-white dark:bg-neutral-900 text-neutral-500'
                            }`}
                        >
                            {f === 'all' ? t('mobile_all') : f === 'lost' ? t('mobile_lost') : t('mobile_found')}
                        </button>
                    ))}
                    </div>
                    
                    {/* Map Type Toggle */}
                    <div className="flex bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-neutral-200 dark:border-white/10 ml-2">
                        <button 
                            onClick={() => setMapType('roadmap')}
                            className={`p-2 rounded-lg transition-colors ${mapType === 'roadmap' ? 'bg-mint text-neutral-900' : 'text-neutral-400'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        </button>
                        <button 
                            onClick={() => setMapType('hybrid')}
                            className={`p-2 rounded-lg transition-colors ${mapType === 'hybrid' ? 'bg-mint text-neutral-900' : 'text-neutral-400'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

       {/* --- Map --- */}
       {isLoaded ? (
          <GoogleMap
             mapContainerStyle={containerStyle}
             center={mapCenter}
             zoom={14}
             onLoad={onLoad}
             onUnmount={onUnmount}
             options={{
                 disableDefaultUI: true,
                 zoomControl: false,
                 mapTypeId: mapType,
                 styles: isDarkMode && mapType === 'roadmap' ? darkMapStyles : []
             }}
             onClick={() => { setSelectedItem(null); setShowSearch(true); }}
          >
             {filteredItems.map(item => {
                 const lat = parseFloat(item.coordinates?.lat);
                 const lng = parseFloat(item.coordinates?.lng);
                 if (isNaN(lat) || isNaN(lng)) return null;

                 return (
                    <Marker
                       key={item._id}
                       position={{ lat, lng }}
                       onClick={() => handleMarkerClick(item)}
                       icon={selectedItem?._id === item._id ? undefined : {
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 6,
                          fillColor: item.status === 'lost' ? '#EF4444' : '#00E0C6', // Red or Mint
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: '#ffffff',
                       }}
                    />
                 );
             })}
          </GoogleMap>
       ) : (
          <div className="h-full w-full flex items-center justify-center">
             <div className="animate-spin text-4xl">🌍</div>
          </div>
       )}

       {/* --- Bottom Controls & List --- */}
       <div className="absolute bottom-24 left-0 right-0 z-[10] flex flex-col gap-4 px-4 pointer-events-none">
          
          {/* Locate Me Button */}
          <div className="flex justify-end pointer-events-auto">
             <button 
                onClick={handleLocateMe}
                className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 shadow-xl flex items-center justify-center text-neutral-900 dark:text-white active:scale-90 transition-transform border border-neutral-100 dark:border-white/10"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
          </div>

          {/* Item Card (If Selected) */}
          <AnimatePresence mode="wait">
             {selectedItem ? (
                <motion.div 
                   key="selected"
                   initial={{ y: 100, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 100, opacity: 0 }}
                   onClick={() => router.push(`/mobile/item/${selectedItem._id}`)}
                   className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-2xl border border-neutral-100 dark:border-white/10 pointer-events-auto active:scale-98 transition-transform"
                >
                   <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                         {selectedItem.image ? (
                             <img src={selectedItem.image.url || selectedItem.image} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                         )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                              <h3 className="font-black text-lg text-neutral-900 dark:text-white truncate">{selectedItem.itemType}</h3>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${selectedItem.status === 'lost' ? 'bg-red-500 text-white' : 'bg-mint text-neutral-900'}`}>
                                  {selectedItem.status === 'lost' ? t('mobile_status_lost') : t('mobile_status_found')}
                              </span>
                          </div>
                          <p className="text-sm text-neutral-500 truncate mb-1">{selectedItem.location}</p>
                          <div className="text-[10px] font-bold text-mint uppercase flex items-center gap-1">
                             <span>{t('map_view_details')}</span>
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                      </div>
                   </div>
                </motion.div>
             ) : (
                 // Horizontal Scroll List (Nearby items or recent)
                 filteredItems.length > 0 && (
                    <motion.div 
                        initial={{ y: 100 }} animate={{ y: 0 }}
                        className="flex gap-3 overflow-x-auto no-scrollbar pointer-events-auto pb-2"
                    >
                        {filteredItems.slice(0, 5).map(item => (
                            <div 
                               key={item._id}
                               onClick={() => {
                                   setSelectedItem(item);
                                   setMapCenter({ lat: parseFloat(item.coordinates.lat), lng: parseFloat(item.coordinates.lng) });
                               }}
                               className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/20 min-w-[140px] w-[140px] shrink-0"
                            >
                                <div className="h-20 rounded-xl bg-neutral-100 overflow-hidden mb-2">
                                     {item.image ? (
                                        <img src={item.image.url || item.image} className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center">📦</div>
                                     )}
                                </div>
                                <h4 className="font-bold text-xs truncate mb-0.5">{item.itemType}</h4>
                                <p className="text-[9px] text-neutral-500 truncate">{item.location}</p>
                            </div>
                        ))}
                    </motion.div>
                 )
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}
