"use client";

import { useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

// Fix for default marker icons in Next.js
// (We are using custom icons so this might be optional but good practice)

interface LocationPickerProps {
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

function MapController({ onMove }: { onMove: (pos: { lat: number, lng: number }) => void }) {
    const map = useMapEvents({
        move: () => {
            const center = map.getCenter();
            onMove({ lat: center.lat, lng: center.lng });
        },
        moveend: () => {
             const center = map.getCenter();
             onMove({ lat: center.lat, lng: center.lng });
        }
    });
    return null;
}

export default function LocationPicker({ onConfirm, onCancel }: LocationPickerProps) {
  const [center, setCenter] = useState({ lat: 41.2995, lng: 69.2401 }); // Tashkent

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="flex-1 relative">
         <MapContainer 
            center={center} 
            zoom={15} 
            scrollWheelZoom={true} 
            className="w-full h-full outline-none"
            zoomControl={false}
         >
            {/* CartoDB Voyager (Clean, Light, Premium) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            />
            
            <MapController onMove={setCenter} />
         </MapContainer>

         {/* Fixed Center Pin */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pb-8 pointer-events-none">
             <div className="relative">
                 <MapPin className="w-10 h-10 text-primary drop-shadow-xl animate-bounce" strokeWidth={2.5} fill="currentColor" />
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 blur-sm rounded-full"></div>
             </div>
         </div>
         
         {/* Back Button */}
         <button 
            onClick={onCancel}
            className="absolute top-6 left-6 z-[400] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform text-zinc-800"
         >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
         </button>
      </div>

      {/* Footer Actions */}
      <div className="bg-background border-t p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[60]">
          <div className="mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Selected Location</span>
              <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="font-medium text-foreground text-sm">{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</p>
              </div>
          </div>
          <button 
            onClick={() => onConfirm(center.lat, center.lng)}
            className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
              <Navigation className="w-5 h-5" />
              Confirm Location
          </button>
      </div>
    </div>
  );
}
