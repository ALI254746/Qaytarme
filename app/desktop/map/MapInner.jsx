"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";

const defaultCenter = [41.2995, 69.2401];

function coordinatesFor(item) {
  const rawLat = item.coordinates?.lat;
  const rawLng = item.coordinates?.lng;
  if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? [lat, lng]
    : null;
}

function markerIcon(found, fill) {
  const dot = found ? "#ffffff" : "#333333";
  const html = `<div style="width:30px;height:38px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))"><svg viewBox="0 0 30 38" width="30" height="38" xmlns="http://www.w3.org/2000/svg"><path d="M15 1C7.3 1 1 7.3 1 15c0 10 14 22 14 22s14-12 14-22C29 7.3 22.7 1 15 1Z" fill="${fill}" stroke="#333" stroke-width="2"/><circle cx="15" cy="15" r="4" fill="${dot}"/></svg></div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [30, 38],
    iconAnchor: [15, 37],
    popupAnchor: [0, -34],
  });
}

function MapController({ selectedItem, onMapReady, layoutKey }) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(timer);
  }, [map, onMapReady, layoutKey]);

  useEffect(() => {
    if (!selectedItem) return;
    const coordinates = coordinatesFor(selectedItem);
    if (coordinates) map.panTo(coordinates, { animate: true, duration: 0.5 });
  }, [map, selectedItem]);

  return null;
}

function imageUrlFor(item) {
  return typeof item.image === "string" ? item.image : item.image?.url || "";
}

function SelectedPopup({ item, onSelect }) {
  const map = useMap();
  const popupRef = useRef(null);

  useEffect(() => {
    const coordinates = coordinatesFor(item);
    if (popupRef.current && coordinates) {
      popupRef.current.setLatLng(coordinates);
      map.openPopup(popupRef.current);
    }
  }, [item._id, map]);

  return (
    <Popup ref={popupRef} position={coordinatesFor(item)} closeButton={false} minWidth={210} maxWidth={230}>
      <div className="relative flex w-[210px] items-center gap-2 p-1 pb-7 text-[#222]">
        <button
          type="button"
          onClick={() => { map.closePopup(); onSelect(null); }}
          aria-label="E’lon oynasini yopish"
          className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-white text-sm text-[#777] shadow"
        >×</button>
        <div className="h-[66px] w-[56px] shrink-0 overflow-hidden rounded-md bg-[#e8e8e8]">
          {imageUrlFor(item) ? (
            <img src={imageUrlFor(item)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-xl text-[#888]">□</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-semibold ${
            item.status === "found" ? "bg-[#444] text-white" : "border border-[#ccc] bg-[#eee] text-[#444]"
          }`}>{item.status === "found" ? "Topilgan" : "Yo‘qolgan"}</span>
          <h3 className="mt-0.5 truncate text-[10px] font-bold">{item.itemType || item.itemName || "Buyum"}</h3>
          <p className="truncate text-[8px] text-[#666]">⌖ {item.location || item.region || "Joy ko‘rsatilmagan"}</p>
          <p className="truncate text-[8px] text-[#666]">▦ {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "Sana ko‘rsatilmagan"}</p>
        </div>
        <Link
          href={`/desktop/item/${item._id}?returnTo=${encodeURIComponent("/desktop/map")}`}
          className="absolute bottom-0 left-0 right-0 rounded bg-[#222] py-1.5 text-center text-[9px] font-semibold text-white hover:bg-[#444]"
        >
          Batafsil ko‘rish
        </Link>
      </div>
    </Popup>
  );
}

export default function MapInner({ items = [], selectedItem, onSelect, onMapReady, layoutKey, layerMode = "density" }) {
  const areaCounts = useMemo(() => {
    const counts = new Map();
    for (const item of items) {
      const key = `${item.region || ""}|${item.district || ""}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [items]);
  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      zoomControl={false}
      scrollWheelZoom
      className="z-0 h-full w-full bg-[#e9e9e9]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="desktop-map-grayscale"
      />
      <MapController selectedItem={selectedItem} onMapReady={onMapReady} layoutKey={layoutKey} />

      {items.map((item) => {
        const coordinates = coordinatesFor(item);
        if (!coordinates) return null;
        const found = item.status === "found";
        const areaKey = `${item.region || ""}|${item.district || ""}`;
        const hasSource = Boolean(
          item.provenance?.channelUsername
          || item.provenance?.sourceName
          || (item.provenance?.sourceType && item.provenance.sourceType !== "unknown"),
        );
        const areaCount = areaCounts.get(areaKey) || 0;
        const fill = layerMode === "source"
          ? (hasSource ? "#50776d" : "#c6c6c6")
          : layerMode === "missing"
            ? (hasSource ? "#777777" : "#c07849")
            : areaCount >= 3 ? "#444444" : "#c5c5c5";
        return (
          <Marker
            key={item._id}
            position={coordinates}
            icon={markerIcon(found, fill)}
            eventHandlers={{ click: () => onSelect(item) }}
          >
            {selectedItem?._id === item._id && (
              <SelectedPopup item={item} onSelect={onSelect} />
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
