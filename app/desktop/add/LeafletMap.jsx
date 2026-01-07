"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition, fetchAddress }) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      fetchAddress(newPos.lat, newPos.lng);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function LeafletMap({ position, setPosition, fetchAddress }) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker position={position} setPosition={setPosition} fetchAddress={fetchAddress} />
    </MapContainer>
  );
}
