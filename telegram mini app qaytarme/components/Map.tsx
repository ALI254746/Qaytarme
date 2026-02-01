"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { Search, MapPin, Smartphone, Key, PawPrint, Navigation2 } from "lucide-react";
import { useUIContext } from "@/context/UIContext";

// --- Helper for Map Events ---
const MapEvents = () => {
    const { setNavVisible } = useUIContext();
    useMapEvents({
        dragstart: () => {
            setNavVisible(false);
        },
        dragend: () => {
             // Optional delay or immediate
             setNavVisible(true);
        },
        zoomstart: () => {
            setNavVisible(false);
        },
        zoomend: () => {
            setNavVisible(true);
        }
    });
    return null;
};

// --- Custom Icons ---
const createIcon = (type: "lost" | "found", iconName: string, isActive: boolean = false) => {
  const isLost = type === "lost";
  const colorClass = isLost 
    ? "bg-linear-to-br from-zinc-900 to-zinc-800 text-white border-2 border-white/20" 
    : "bg-linear-to-br from-primary to-primary/80 text-white border-2 border-white/40";
  
  // Choose icon based on name
  let IconComponent = MapPin;
  if (iconName === 'tech') IconComponent = Smartphone;
  if (iconName === 'keys') IconComponent = Key;
  if (iconName === 'pets') IconComponent = PawPrint;

  const size = isActive ? 56 : 48;
  const iconSize = isActive ? 28 : 24;

  const html = renderToStaticMarkup(
    <div className={`relative rounded-full ${colorClass} flex items-center justify-center shadow-2xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
         style={{ width: `${size}px`, height: `${size}px` }}>
       <IconComponent className="w-6 h-6" style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
       {/* Pulse Effect - Enhanced */}
       <div className={`absolute inset-0 rounded-full ${isLost ? 'bg-zinc-900/40' : 'bg-primary/40'} animate-ping opacity-30`}></div>
       {/* Glow Effect */}
       <div className={`absolute inset-0 rounded-full ${isLost ? 'bg-zinc-900/20' : 'bg-primary/20'} blur-md`}></div>
       {/* Triangle pointer - Enhanced */}
       <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 ${isLost ? 'bg-zinc-900' : 'bg-primary'} rotate-45 shadow-lg`}></div>
       {/* Active Ring */}
       {isActive && (
         <div className="absolute inset-0 rounded-full border-4 border-white/60 animate-pulse"></div>
       )}
    </div>
  );

  return L.divIcon({
    html: html,
    className: "bg-transparent marker-custom",
    iconSize: [size, size],
    iconAnchor: [size / 2, size + 8], // Point at bottom center
    popupAnchor: [0, -(size + 8)],
  });
};

// User Location Marker Component
const UserLocationMarker = ({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) => {
    const map = useMap();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    
    useEffect(() => {
        map.locate({
            watch: false,
            setView: false,
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });

        map.on("locationfound", function (e) {
            const { lat, lng } = e.latlng;
            setUserLocation([lat, lng]);
            if (onLocationFound) {
                onLocationFound(lat, lng);
            }
        });

        map.on("locationerror", function (e) {
            console.log("Location error:", e.message);
        });
    }, [map, onLocationFound]);

    if (!userLocation) return null;

    // Create user location icon
    const userIcon = L.divIcon({
        html: renderToStaticMarkup(
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-primary border-4 border-white shadow-lg flex items-center justify-center">
                    <Navigation2 className="w-5 h-5 text-white" />
                </div>
            </div>
        ),
        className: "bg-transparent",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
    });

    return <Marker position={userLocation} icon={userIcon} />;
};

// Location Handler Component - handles location requests from parent
const LocationHandler = ({ 
  onLocationRequest, 
  onLocationFound 
}: { 
  onLocationRequest?: () => void;
  onLocationFound?: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  
  useEffect(() => {
    // Listen for location found
    const handleLocationFound = (e: L.LocationEvent) => {
      const { lat, lng } = e.latlng;
      if (onLocationFound) {
        onLocationFound(lat, lng);
      }
      map.flyTo([lat, lng], 15, {
        animate: true,
        duration: 1.5
      });
    };

    const handleLocationError = (e: L.ErrorEvent) => {
      console.log("Location error:", e.message);
    };

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);

    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
    };
  }, [map, onLocationFound]);

  // Trigger location request when prop changes
  useEffect(() => {
    if (onLocationRequest) {
      map.locate({
        watch: false,
        setView: true,
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
  }, [map, onLocationRequest]);

  return null;
};

const mockPins = [
    { id: 1, lat: 41.2995, lng: 69.2401, type: "lost", category: "pets", title: "Golden Retriever" },
    { id: 2, lat: 41.3111, lng: 69.2797, type: "found", category: "tech", title: "iPhone 13" },
    { id: 3, lat: 41.2922, lng: 69.2244, type: "lost", category: "keys", title: "House Keys" },
    { id: 4, lat: 41.3200, lng: 69.2500, type: "found", category: "wallet", title: "Leather Wallet" },
];

interface MapComponentProps {
  mapStyle?: "voyager" | "satellite";
  onLocationRequest?: () => void;
  showUserLocation?: boolean;
}

export default function MapComponent({ 
  mapStyle = "voyager",
  onLocationRequest,
  showUserLocation = false 
}: MapComponentProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Tashkent Coordinates
  const center: [number, number] = [41.2995, 69.2401];

  // Map style URLs
  const tileUrls = {
    voyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
  };

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full outline-none"
        zoomControl={false}
      >
        <MapEvents />
        <LocationHandler 
          onLocationRequest={onLocationRequest}
          onLocationFound={handleLocationFound}
        />
        
        {/* Dynamic TileLayer based on mapStyle */}
        <TileLayer
          key={mapStyle} // Force re-render when style changes
          attribution={mapStyle === "satellite" 
            ? '&copy; <a href="https://www.esri.com/">Esri</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          }
          url={tileUrls[mapStyle]}
        />

        {mockPins.map((pin) => (
            <Marker 
                key={pin.id} 
                position={[pin.lat, pin.lng]} 
                icon={createIcon(pin.type as "lost" | "found", pin.category, false)}
            >
                <Popup 
                  className="glass-popup"
                  closeButton={false}
                  autoClose={false}
                >
                  <div className="p-3 min-w-[140px]">
                    <h3 className="font-bold text-sm text-zinc-900 mb-2">{pin.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        pin.type === 'lost' 
                          ? 'bg-linear-to-r from-zinc-900 to-zinc-800 text-white shadow-md' 
                          : 'bg-linear-to-r from-primary to-primary/80 text-white shadow-md'
                      }`}>
                        {pin.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {pin.category}
                      </span>
                    </div>
                  </div>
                </Popup>
            </Marker>
        ))}
        
        {/* User Location Marker */}
        {showUserLocation && userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              html: renderToStaticMarkup(
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-primary border-4 border-white shadow-lg flex items-center justify-center">
                    <Navigation2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              ),
              className: "bg-transparent",
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}
