"use client";
import {useState} from "react";
import Link from "next/link";
import {Folder,ClipboardList,ArrowRight} from "lucide-react";
import {Heading,Panel,categoryLabel} from "../../components/qaytarme/ui";
import {useAdminData} from "../../components/qaytarme/admin-api";
import {State,Stat} from "../../components/qaytarme/AdminShared";
export default function Categories(){
 const {data,loading,error,refresh}=useAdminData("categories"),[q,setQ]=useState("");
 const rows=(data||[]).filter(c=>categoryLabel(c.key).toLowerCase().includes(q.toLowerCase()));
 return <><Heading title="Kategoriyalar" text="E’lonlar va moslik algoritmi ishlatadigan buyum toifalari."/><State {...{loading,error,refresh}}/><div className="qm-stats"><Stat title="Jami kategoriyalar" value={data?.length} Icon={Folder} text="Moslik algoritmi bilan bog‘langan"/><Stat title="E’lonlar" value={data?.reduce((s,c)=>s+c.count,0)} Icon={ClipboardList} text="Barcha toifalar bo‘yicha"/></div><Panel title="Kategoriya ro‘yxati"><div className="qm-toolbar"><input aria-label="Kategoriyani qidirish" placeholder="Kategoriya nomi" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="qm-table-wrap"><table className="qm-table"><thead><tr><th>Kategoriya</th><th>Kalit</th><th>E’lonlar</th><th>Ko‘rish</th></tr></thead><tbody>{rows.map(c=><tr key={c.key}><td><strong>{categoryLabel(c.key)}</strong></td><td>{c.key}</td><td>{c.count}</td><td><Link className="qm-btn" href={"/desktop/listings?category="+c.key}>E’lonlarni ko‘rish <ArrowRight size={12}/></Link></td></tr>)}</tbody></table></div></Panel></>;
}

