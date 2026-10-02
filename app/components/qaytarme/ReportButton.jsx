"use client";
import {useState} from "react";
import {useSession} from "next-auth/react";
import Link from "next/link";
import {Flag,X} from "lucide-react";
import {adminRequest} from "./admin-api";
export default function ReportButton({itemId}){
 const {data:session}=useSession(),[open,setOpen]=useState(false),[reason,setReason]=useState("privacy"),[description,setDescription]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(e){e.preventDefault();setBusy(true);try{await adminRequest("reports",session.user.accessToken,{itemId,reason,description});setMessage("Shikoyatingiz moderatorga yuborildi.");setDescription("");}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <><button className="qm-btn" onClick={()=>setOpen(true)}><Flag size={13}/>Shikoyat qilish</button>{open&&<div className="qm-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><section className="qm-modal qm-panel" role="dialog" aria-modal="true" aria-label="E’lon bo‘yicha shikoyat"><div className="qm-panel-heading"><h2>E’lon bo‘yicha shikoyat</h2><button className="qm-icon-btn" aria-label="Oynani yopish" onClick={()=>setOpen(false)}><X size={15}/></button></div>{session?<form className="qm-form" onSubmit={submit}>{message&&<div role="status" className="qm-notice">{message}</div>}<label><span>Sababi</span><select value={reason} onChange={e=>setReason(e.target.value)}><option value="privacy">Shaxsiy ma’lumot oshkor qilingan</option><option value="fraud">Firibgarlikdan shubha</option><option value="wrong_category">Noto‘g‘ri kategoriya</option><option value="duplicate">Takroriy e’lon</option><option value="other">Boshqa</option></select></label><label><span>Qo‘shimcha izoh</span><textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Muammoni qisqacha tushuntiring..."/></label><button className="qm-btn qm-btn-dark" disabled={busy}>{busy?"Yuborilmoqda…":"Shikoyatni yuborish"}</button></form>:<div className="qm-panel-body"><p>Shikoyat yuborish uchun hisobga kiring.</p><Link className="qm-btn qm-btn-dark" href="/login">Kirish</Link></div>}</section></div>}</>;
}

