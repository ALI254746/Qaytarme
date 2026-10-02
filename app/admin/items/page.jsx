"use client";
import {useState} from "react";
import Link from "next/link";
import {Download,Plus,RefreshCw} from "lucide-react";
import {Heading,Panel,Empty,Badge} from "../../components/qaytarme/ui";
import {useAdminData,downloadJson} from "../../components/qaytarme/admin-api";
import {State,ItemsTable,labels} from "../../components/qaytarme/AdminShared";
export default function Items(){
 const {data,loading,error,refresh}=useAdminData("items"),[q,setQ]=useState(""),[tab,setTab]=useState("all"),[source,setSource]=useState("all");
 const rows=(data||[]).filter(i=>(tab==="all"||i.moderationStatus===tab)&&(source==="all"||(source==="telegram"?i.provenance?.sourceType==="telegram":i.provenance?.sourceType!=="telegram"))&&[i.itemType,i._id,i.region,i.user?.name].join(" ").toLowerCase().includes(q.toLowerCase()));
 return <><Heading title="E’lonlar" text="Platformadagi e’lonlarni ko‘ring va moderatsiya holatini boshqaring."><button className="qm-btn" onClick={()=>downloadJson(rows,"qaytarme-elonlar")}><Download size={14}/>Eksport</button><Link className="qm-btn qm-btn-dark" href="/desktop/add"><Plus size={14}/>E’lon qo‘shish</Link></Heading><State {...{loading,error,refresh}}/><Panel><div className="qm-toolbar qm-tabs">{["all","approved","pending","returned","rejected"].map(k=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{k==="all"?"Barchasi":labels[k]} <Badge>{(data||[]).filter(i=>k==="all"||i.moderationStatus===k).length}</Badge></button>)}</div><div className="qm-toolbar"><input aria-label="E’lonlarni qidirish" placeholder="Nomi, muallifi yoki e’lon ID bo‘yicha qidirish" value={q} onChange={e=>setQ(e.target.value)}/><select aria-label="Manba" value={source} onChange={e=>setSource(e.target.value)}><option value="all">Barcha manbalar</option><option value="telegram">Telegram</option><option value="web">Saytdagi e’lonlar</option></select><button className="qm-btn" onClick={refresh}><RefreshCw size={13}/>Yangilash</button></div><ItemsTable rows={rows} review/>{!loading&&!rows.length&&<Empty title="E’lon topilmadi"/>}<div className="qm-row-tools"><small>{rows.length} ta ko‘rsatilmoqda · oxirgi 500 ta e’lon</small><Link href="/admin/moderation" className="qm-inline-link">Moderatsiyada tekshirish →</Link></div></Panel></>;
}

