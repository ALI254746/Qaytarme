"use client";
import {useState} from "react";
import {Search,MapPin,X} from "lucide-react";
import {getApiUrl} from "@/lib/api-config";
export default function AddressSearch({onSelect}){
 const [query,setQuery]=useState(""),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function search(e){e.preventDefault();if(busy)return;setBusy(true);setMessage("");setResults([]);try{const response=await fetch(getApiUrl("geocoding/search?q="+encodeURIComponent(query.trim())));const data=await response.json();if(!response.ok)throw Error(data.message||"Manzilni qidirib bo‘lmadi.");setResults(data.results||[]);if(!data.results?.length)setMessage("Manzil topilmadi. Shahar va ko‘cha nomini aniqroq yozing.");}catch(e){setMessage(e.message||"Server bilan bog‘lanib bo‘lmadi.");}finally{setBusy(false);}}
 return <div className="qm-address-search"><form onSubmit={search}><Search size={15}/><input required minLength={3} maxLength={150} aria-label="Manzilni qidirish" placeholder="Manzil qidirish: shahar, ko‘cha yoki joy nomi..." value={query} onChange={e=>{setQuery(e.target.value);setResults([]);setMessage("");}}/><button className="qm-btn qm-btn-dark" disabled={busy}>{busy?"Qidirilmoqda…":"Manzilni topish"}</button></form>{message&&<p role="status">{message}</p>}{results.length>0&&<div className="qm-address-results">{results.map((r,i)=><button key={i} onClick={()=>{onSelect(r);setQuery(r.label);setResults([]);setMessage("Manzil xaritada belgilandi.");}}><MapPin size={14}/><span>{r.label}</span></button>)}</div>}<small><a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></small></div>;
}

