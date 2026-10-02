"use client";

import React, {useEffect,useState} from "react";
import {getApiUrl} from "@/lib/api-config";
import { MapContainer, Marker, TileLayer, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:20px;height:20px;border:2px solid #fff;border-radius:50%;background:#1590ff;box-shadow:0 0 0 2px #0569c9"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MoveMap({center,zoom}) {const map=useMap();useEffect(()=>{map.setView(center,zoom);},[map,center[0],center[1],zoom]);return null;}

export default function DetailLocationMap({ coordinates, locationResolution, region, district, location }) {
  const [area,setArea]=useState(null),[areaResolved,setAreaResolved]=useState(false);
  useEffect(()=>{const c=new AbortController();const q=[district,region].filter(v=>v && !/^unknown$/i.test(v)).join(", ") || location; if(!q){setAreaResolved(true);return;}fetch(getApiUrl("geocoding/search?q="+encodeURIComponent(q)),{signal:c.signal}).then(r=>r.ok?r.json():null).then(data=>{setArea(data?.results?.[0]||null);setAreaResolved(true);}).catch(()=>{if(!c.signal.aborted)setAreaResolved(true);});return()=>c.abort();},[region,district,location]);
  const lat = Number(coordinates?.lat);
  const lng = Number(coordinates?.lng);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 37 && lat <= 46 && lng >= 55.9 && lng <= 73.2 && (lat !== 0 || lng !== 0);
  const distanceKm = (aLat,aLng,bLat,bLng) => {const rad=v=>v*Math.PI/180;const dLat=rad(bLat-aLat),dLng=rad(bLng-aLng);return 6371*2*Math.asin(Math.sqrt(Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLng/2)**2));};
  const verifiedCoordinates = locationResolution?.provider === "geoapify" && valid;
  const storedMatchesAddress = valid && area && distanceKm(lat,lng,area.lat,area.lng) <= 30;
  const useStored = verifiedCoordinates || (areaResolved && (!area || storedMatchesAddress));
  const markerCoordinates = useStored && valid ? [lat,lng] : area && Number(area.confidence) >= 0.75 ? [area.lat,area.lng] : null;
  const center = markerCoordinates || area ? markerCoordinates || [area.lat,area.lng] : [41,64.5];
  const delta = 0.016;
  const bounds = [
    [center[0] - delta, center[1] - delta],
    [center[0] + delta, center[1] + delta],
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      dragging={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      className="detail-location-map h-full w-full bg-[#e9e9e9]"
    >
      <MoveMap center={center} zoom={markerCoordinates?(useStored?13:(area.resultType==="city"||area.resultType==="district"?11:15)):area?11:5}/>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="desktop-map-grayscale"
      />
      {!markerCoordinates && <div style={{position:"absolute",bottom:22,left:8,right:8,zIndex:500,background:"white",padding:6,fontSize:11}}>{!areaResolved ? "Manzil Geoapify orqali aniqlanmoqda…" : `Aniq manzil topilmadi — ${location || district || region || "hudud noma’lum"}`}</div>}
      {markerCoordinates && <Marker position={markerCoordinates} icon={pinIcon}><Popup>{useStored && verifiedCoordinates ? (locationResolution.matchedLabel || location || "Geoapify aniqlagan joy") : area?.label || location || "Manzil"}{useStored ? "" : " · taxminiy hudud markazi"}</Popup></Marker>}
      {markerCoordinates && !useStored && <div style={{position:"absolute",bottom:22,left:8,right:8,zIndex:500,background:"white",padding:6,fontSize:11}}>Geoapify aniqlagan joy: {area?.label}. Nuqta hudud bo‘yicha taxminiy.</div>}
    </MapContainer>
  );
}
