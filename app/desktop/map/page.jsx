"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

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

// Dark Mode Map Styles (Obsidian/Dark theme)
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

import { GOOGLE_MAPS_LIBRARIES } from "../../map-constants";

export default function MapPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage(); 
  
  // Debug API Key availability
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error("GOOGLE MAPS API KEY IS MISSING! check your .env file or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY variable.");
    }
  }, []);

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
  const [mapType, setMapType] = useState('roadmap'); // roadmap, hybrid
  
  const mapRef = useRef(null);

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  // Update map center when mapCenter state changes
  useEffect(() => {
    if (mapRef.current && mapCenter) {
      try {
        mapRef.current.panTo(mapCenter);
        mapRef.current.setZoom(16);
      } catch (e) {
        console.warn("Map pan error:", e);
      }
    }
  }, [mapCenter]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(getApiUrl("ariza?limit=1000"), { cache: 'no-store' }); 
          if (res.ok) {
            const data = await res.json();
            
            let itemsArray = [];
            if (Array.isArray(data)) {
              itemsArray = data;
            } else if (data && Array.isArray(data.items)) {
              itemsArray = data.items;
            } else if (data && Array.isArray(data.data)) {
              itemsArray = data.data;
            } else if (data && Array.isArray(data.arizalar)) {
              itemsArray = data.arizalar;
            }
            
            // Filter out items without coordinates
            const validItems = itemsArray.filter(item => {
               const hasCoords = item.coordinates && item.coordinates.lat && item.coordinates.lng;
               return hasCoords;
            });
            
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

  // Filter items logic
  const filteredItems = items.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const itemType = (item.itemType || "").toLowerCase();
    const location = (item.location || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    const description = (item.description || "").toLowerCase();
    
    const matchesSearch = itemType.includes(searchLower) ||
                          location.includes(searchLower) ||
                          title.includes(searchLower) ||
                          description.includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  // Automatically fit map bounds to show all items
  useEffect(() => {
    if (mapRef.current && filteredItems.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      filteredItems.forEach(item => {
        if (item.coordinates?.lat && item.coordinates?.lng) {
          bounds.extend({
            lat: parseFloat(item.coordinates.lat),
            lng: parseFloat(item.coordinates.lng)
          });
          hasValidCoords = true;
        }
      });

      if (hasValidCoords) {
        mapRef.current.fitBounds(bounds);
        
        // If only one marker, avoid too close zoom
        if (filteredItems.length === 1) {
             mapRef.current.setZoom(14); 
        }
      }
    }
  }, [filteredItems]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setMapCenter({ lat: parseFloat(item.coordinates.lat), lng: parseFloat(item.coordinates.lng) });
  };

  if (loadError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black text-center p-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-500 mb-2">{t("map_error_title")}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
          {t("map_error_desc")} {loadError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] w-full flex overflow-hidden bg-[#F7F6E2] dark:bg-black rounded-[2rem] border border-[#2E2D2B]/10 dark:border-white/10 shadow-2xl">
      
         {/* Desktop Sidebar (Left) */}
         <div className="hidden lg:flex w-96 h-full bg-white dark:bg-black border-r border-neutral-100 dark:border-white/5 flex-col shadow-2xl z-10">
             
             {/* Header */}
             <div className="p-6 border-b border-neutral-100 dark:border-white/5 space-y-4">
                 <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <span className="text-3xl">🗺️</span> {t("nav_map")}
                 </h1>
                 
                 {/* Search */}
                 <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl flex items-center p-3 gap-3 transition-colors focus-within:bg-white dark:focus-within:bg-neutral-800 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-mint">
                     <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input 
                        type="text" 
                        placeholder={t("map_search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none font-bold text-neutral-900 dark:text-white text-sm"
                     />
                 </div>

                 {/* Filters */}
                 <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl relative">
                    <motion.div 
                       className="absolute top-1 bottom-1 bg-white dark:bg-neutral-700 rounded-lg shadow-sm z-0"
                       initial={false}
                       animate={{ 
                         left: activeFilter === 'all' ? '4px' : activeFilter === 'lost' ? '33%' : '66%',
                         width: '32%' 
                       }}
                       transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    {['all', 'lost', 'found'].map(f => (
                       <button 
                         key={f}
                         onClick={() => setActiveFilter(f)}
                         className={`flex-1 relative z-10 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeFilter === f ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}
                       >
                         {f === 'all' ? t("filter_all") : f === 'lost' ? t("filter_lost") : t("filter_found")}
                       </button>
                    ))}
                 </div>
             </div>

             {/* Results List */}
             <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                 <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 px-2">
                    {filteredItems.length} {t("map_results_suffix")}
                 </div>
                 
                 <AnimatePresence>
                     {filteredItems.map(item => (
                        <motion.div 
                           key={item._id}
                           layout
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           onClick={() => handleItemClick(item)}
                           className={`group p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                              selectedItem?._id === item._id
                                ? 'bg-mint text-neutral-900 border-mint shadow-lg shadow-mint/20'
                                : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5 hover:border-mint/50'
                           }`}
                        >
                           <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                              {item.image?.url || (typeof item.image === 'string' && item.image) ? (
                                <img src={item.image?.url || item.image} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                  <h3 className={`font-bold truncate ${selectedItem?._id === item._id ? 'text-neutral-900' : 'text-neutral-900 dark:text-white'}`}>{item.itemType}</h3>
                                  {item.status === 'lost' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" title={t("filter_lost")} />}
                               </div>
                               <p className={`text-xs truncate mb-2 ${selectedItem?._id === item._id ? 'text-neutral-700' : 'text-neutral-500'}`}>{item.location}</p>
                               <span className="text-[10px] font-bold opacity-60 uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                               <div className="text-[9px] text-neutral-400 font-mono mt-1 opacity-50">
                                  📍 {item.coordinates?.lat ? `${Number(item.coordinates.lat).toFixed(4)}, ${Number(item.coordinates.lng).toFixed(4)}` : t("map_no_coords")}
                               </div>
                           </div>
                        </motion.div>
                     ))}
                 </AnimatePresence>

                 {filteredItems.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                       <div className="text-4xl mb-2">🔍</div>
                       <p className="text-sm font-bold">{t("empty_title")}</p>
                    </div>
                 )}
             </div>

         </div>

      {/* --- Map Container --- */}
      <div className="flex-1 relative z-0">
         {isLoaded ? (
            <>
               {/* Map Type Toggle */}
               <div className="absolute top-4 right-4 z-[500] flex bg-white/90 dark:bg-black/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-neutral-100 dark:border-white/10">
                  <button 
                     onClick={() => setMapType('roadmap')}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${mapType === 'roadmap' ? 'bg-mint text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
                  >
                     {t("map_type_roadmap")}
                  </button>
                  <button 
                     onClick={() => setMapType('hybrid')}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${mapType === 'hybrid' ? 'bg-mint text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
                  >
                     {t("map_type_hybrid")}
                  </button>
               </div>

               <GoogleMap
               mapContainerStyle={containerStyle}
               center={defaultCenter}
               zoom={13}
               onLoad={onLoad}
               onUnmount={onUnmount}
               options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapTypeId: mapType,
                  styles: isDarkMode && mapType === 'roadmap' ? darkMapStyles : []
               }}
            >
               {filteredItems.map(item => {
                  const lat = parseFloat(item.coordinates?.lat);
                  const lng = parseFloat(item.coordinates?.lng);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  
                  return (
                    <Marker
                       key={item._id}
                       position={{ lat, lng }}
                       onClick={() => setSelectedItem(item)}
                    />
                  );
               })}

               {selectedItem && (
                  <InfoWindow
                     position={{ lat: parseFloat(selectedItem.coordinates.lat), lng: parseFloat(selectedItem.coordinates.lng) }}
                     onCloseClick={() => setSelectedItem(null)}
                  >
                     <div className="min-w-[160px] max-w-[200px] text-black p-1">
                        <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-neutral-100">
                           {selectedItem.image?.url || (typeof selectedItem.image === 'string' && selectedItem.image) ? (
                             <img src={selectedItem.image?.url || selectedItem.image} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                           )}
                        </div>
                        <h3 className="font-bold text-sm mb-0.5 line-clamp-1">{selectedItem.itemType}</h3>
                        <p className="text-[10px] text-neutral-500 mb-2 line-clamp-2 leading-tight">{selectedItem.location}</p>
                        <button 
                           onClick={() => router.push(`/desktop/item/${selectedItem._id}`)}
                           className="w-full py-1.5 bg-mint text-neutral-900 rounded-md font-bold text-[10px] uppercase hover:brightness-105"
                        >
                           {t("map_details")}
                        </button>
                     </div>
                  </InfoWindow>
               )}
            </GoogleMap>
            </>
         ) : (
            <div className="flex items-center justify-center h-full w-full bg-[#F7F6E2] dark:bg-black">
               <div className="animate-spin text-4xl">🌍</div>
            </div>
         )}
      </div>

    </div>
  );
}
