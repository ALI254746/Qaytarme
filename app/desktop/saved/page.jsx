"use client";
import {useEffect,useState} from "react";
import {getApiUrl} from "@/lib/api-config";
import {Heading,Panel,Empty} from "../../components/qaytarme/ui";
import {ItemCard} from "@/app/components/qaytarme/ItemCard";
export default function Saved(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[failed,setFailed]=useState(0);
 useEffect(()=>{const c=new AbortController();let ids=[];try{ids=JSON.parse(localStorage.getItem("qaytarme:saved-items")||"[]");if(!Array.isArray(ids))ids=[];}catch{}
 Promise.all(ids.map(async id=>{try{const r=await fetch(getApiUrl("ariza/"+id),{signal:c.signal});return r.ok?await r.json():null;}catch{return null;}})).then(rows=>{if(!c.signal.aborted){setItems(rows.filter(Boolean));setFailed(rows.filter(x=>!x).length);setLoading(false);}});return()=>c.abort();},[]);
 return <><Heading title="Saqlangan e’lonlar" text="Keyinroq ko‘rish uchun saqlagan buyumlaringiz."/>
 {failed>0 && <p className="qm-notice">{failed} ta e’lon hozir mavjud emas yoki yuklanmadi.</p>}
 {loading?<div className="qm-loading">Yuklanmoqda…</div>:items.length?<div className="qm-card-grid">{items.map(item=><ItemCard key={item._id} item={item}/>)}</div>:<Panel><Empty title="Hali e’lon saqlamagansiz" text="E’lon kartochkasidagi saqlash belgisini bosing."/></Panel>}</>;
}

