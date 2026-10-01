"use client";

import React from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:20px;height:20px;border:2px solid #fff;border-radius:50%;background:#777;box-shadow:0 0 0 2px #888"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function DetailLocationMap({ coordinates }) {
  const lat = Number(coordinates?.lat);
  const lng = Number(coordinates?.lng);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= 37 && lat <= 46 && lng >= 55.9 && lng <= 73.2 &&
    (lat !== 0 || lng !== 0);
  const center = valid ? [lat, lng] : [41, 64.5];
  const delta = 0.016;
  const bounds = [
    [center[0] - delta, center[1] - delta],
    [center[0] + delta, center[1] + delta],
  ];

  return (
    <MapContainer
      bounds={bounds}
      zoom={13}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      className="detail-location-map h-full w-full bg-[#e9e9e9]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="desktop-map-grayscale"
      />
      {valid && <Marker position={center} icon={pinIcon} />}
    </MapContainer>
  );
}
