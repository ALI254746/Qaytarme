"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

// Only run this on client side to avoid potential build errors with 'window'
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  });
}

const defaultCenter = [41.2995, 69.2401]; // Tashkent

export default function MapInner({ items }) {
  // Safe check for array
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={13} 
      style={{ width: "100%", height: "100%" }}
      className="z-0"
    >
      {/* Light Mode: Voyager, ideal for general use */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {safeItems.map((item) => (
        <Marker
          key={item._id || Math.random()}
          position={[
            Number(item.coordinates?.lat) || 41.2995,
            Number(item.coordinates?.lng) || 69.2401
          ]}
        >
          <Popup>
            <div className="p-1 min-w-[150px]">
              <h3 className="font-bold text-sm mb-1 text-gray-800">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{item.location}</p>
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-md" />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}