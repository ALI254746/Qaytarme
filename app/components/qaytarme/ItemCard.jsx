"use client";
import {useState,useEffect} from "react";
import Link from "next/link";
import {Bookmark} from "lucide-react";
import {ItemImage,Badge,Source,MapPin,dateOf} from "./ui";
export function ItemCard({item}) {
 const [saved,setSaved]=useState(false);
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem("qaytarme:saved-items")||"[]").includes(item._id));}catch{}},[item._id]);
 function save(){try{const ids=JSON.parse(localStorage.getItem("qaytarme:saved-items")||"[]");const next=saved?ids.filter(id=>id!==item._id):[...ids,item._id];localStorage.setItem("qaytarme:saved-items",JSON.stringify(next));setSaved(!saved);}catch{}}
 return <article className="qm-card">
  <div className="qm-card-media"><Link href={"/desktop/item/"+item._id}><ItemImage item={item}/></Link><Badge tone={item.status==="lost"?"lost":"found"}>{item.status==="lost"?"Yo‘qolgan":"Topilgan"}</Badge><button className={"qm-save "+(saved?"saved":"")} onClick={save} aria-label={saved?"Saqlanganlardan olib tashlash":"E’lonni saqlash"} aria-pressed={saved}><Bookmark size={16} fill={saved?"currentColor":"none"}/></button></div>
  <Link href={"/desktop/item/"+item._id} className="qm-card-body"><h3>{item.itemType || item.itemName || "Buyum"}</h3><p><MapPin size={13}/>{(item.location && item.location !== "Unknown" ? item.location : [item.region,item.district].filter(v=>v && v!=="Unknown").join(", ")) || "Joy noma’lum"}</p><div className="qm-card-footer"><Source item={item}/><time>{dateOf(item.createdAt)}</time></div></Link>
 </article>;
}