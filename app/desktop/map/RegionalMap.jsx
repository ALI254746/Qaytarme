"use client";
import {useEffect} from "react";
import {MapContainer,TileLayer,CircleMarker,Tooltip,useMap} from "react-leaflet";
import "leaflet/dist/leaflet.css";
function Controller({areas,selected,onMapReady}){const map=useMap();useEffect(()=>{onMapReady(map);const timer=setTimeout(()=>map.invalidateSize(),100);return()=>clearTimeout(timer);},[map,onMapReady]);useEffect(()=>{const points=areas.filter(a=>a.center&&!a.suppressed).map(a=>a.center);if(points.length)map.fitBounds(points,{padding:[45,45],maxZoom:10});},[map,areas]);useEffect(()=>{if(selected?.center&&!selected.suppressed)map.panTo(selected.center);},[map,selected]);return null;}
export default function RegionalMap({areas,selected,onSelect,onMapReady,layer,metric}){
 const visible=areas.filter(a=>a.center&&!a.suppressed),maximum=Math.max(1,...visible.map(a=>a[metric]));
 return <MapContainer center={[41.5,64.5]} zoom={5} zoomControl={false} className="qm-regional-leaflet"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Controller {...{areas,selected,onMapReady}}/>{visible.map(a=>{const value=a[metric],shade=layer==="density"?["#d5d6d9","#b3b5ba","#8e9199","#666975","#363944"][Math.min(4,Math.floor(value/maximum*4))]:layer==="source"?(a.channels.length?"#535762":"#dbdde2"):(a.channels.length?"#d5d6d9":"#535762");return <CircleMarker key={a.key} center={a.center} radius={selected?.key===a.key?25:12+Math.sqrt(value/maximum)*14} pathOptions={{color:selected?.key===a.key?"#17191e":"#fff",weight:2,fillColor:shade,fillOpacity:.85}} eventHandlers={{click:()=>onSelect(a.key)}}><Tooltip direction="top">{a.name}: {value} ta e’lon</Tooltip></CircleMarker>;})}</MapContainer>;
}

