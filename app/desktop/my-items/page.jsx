"use client";
import {useEffect,useState} from "react";
import {useSession} from "next-auth/react";
import Link from "next/link";
import {Plus,RefreshCw} from "lucide-react";
import {getApiUrl} from "@/lib/api-config";
import {Heading,Panel,Empty,Badge} from "../../components/qaytarme/ui";
import {ItemCard} from "@/app/components/qaytarme/ItemCard";
export default function MyItems(){
 const {data:session,status}=useSession(),[items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState("all"),[reload,setReload]=useState(0);
 useEffect(()=>{if(status==="loading")return;if(!session){setLoading(false);return;}const c=new AbortController();setLoading(true);fetch(getApiUrl("ariza/my"),{signal:c.signal,headers:{Authorization:"Bearer "+session.user.accessToken}}).then(async r=>{if(!r.ok)throw Error("E’lonlarni yuklab bo‘lmadi.");return r.json();}).then(rows=>{setItems(Array.isArray(rows)?rows:[]);setError("");}).catch(e=>{if(e.name!=="AbortError")setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[session,status,reload]);
 const rows=items.filter(i=>tab==="all"||i.status===tab||tab==="returned"&&i.moderationStatus==="returned");
 return <><Heading title="Mening e’lonlarim" text="Yo‘qolgan va topilgan buyumlaringiz, moderatsiya va qaytarish holati."><button className="qm-btn" onClick={()=>setReload(v=>v+1)}><RefreshCw size={14}/>Yangilash</button><Link className="qm-btn qm-btn-dark" href="/desktop/add"><Plus size={14}/>E’lon berish</Link></Heading>{!session&&status!=="loading"?<Panel><Empty title="E’lonlaringizni ko‘rish uchun kiring"><Link className="qm-btn qm-btn-dark" href="/login?callbackUrl=%2Fdesktop%2Fmy-items">Hisobga kirish</Link></Empty></Panel>:<><div className="qm-tabs" style={{marginBottom:20}}>{[["all","Barchasi"],["lost","Yo‘qolgan"],["found","Topilgan"],["returned","Qaytarilgan"]].map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</div>{error&&<div className="qm-notice qm-error">{error}</div>}{loading?<div className="qm-loading">Yuklanmoqda…</div>:rows.length?<div className="qm-card-grid">{rows.map(item=><div key={item._id}><ItemCard item={item}/><div style={{marginTop:7}}><Badge>{({pending:"Moderatsiya kutilmoqda",approved:"Faol",rejected:"Rad etilgan",returned:"Egasiga qaytarilgan"})[item.moderationStatus]||item.moderationStatus}</Badge></div></div>)}</div>:<Panel><Empty title="Hali e’lon yo‘q" text="Buyum yo‘qotdingizmi yoki topdingizmi? Birinchi e’loningizni bering."><Link className="qm-btn qm-btn-dark" href="/desktop/add">E’lon berish</Link></Empty></Panel>}</>}</>;
}

