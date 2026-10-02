"use client";
import Link from "next/link";
import {Eye} from "lucide-react";
import {Badge,ItemImage,Source,dateOf} from "./ui";
export const labels={pending:"Kutilmoqda",approved:"Tasdiqlangan",rejected:"Rad etilgan",returned:"Egasiga qaytarildi",open:"Ochiq",resolved:"Hal qilingan",dismissed:"Asossiz"};
export const reasons={privacy:"Shaxsiy ma’lumot oshkor qilingan",fraud:"Firibgarlikdan shubha",wrong_category:"Noto‘g‘ri kategoriya",duplicate:"Takroriy e’lon",other:"Boshqa"};
export const auditNames={moderation:"E’lon moderatsiyasi",report:"Shikoyat yuborildi","report-resolution":"Shikoyat hal qilindi",settings:"Sozlamalar o‘zgartirildi","channel-add":"Telegram kanal ulandi","channel-state":"Kanal holati o‘zgartirildi","telegram-import":"Telegram importi"};
export function State({loading,error,refresh}){return loading?<div className="qm-loading">Ma’lumotlar yuklanmoqda…</div>:error?<div className="qm-notice qm-error" role="alert">{error} <button className="qm-btn" onClick={refresh}>Qayta urinish</button></div>:null;}
export function Stat({title,value,Icon,text}){return <div className="qm-stat"><Icon size={18}/><div><small>{title}</small><strong>{value??"—"}</strong><p>{text}</p></div></div>;}
export function ModerationBadge({value}){return <Badge tone={value==="approved"?"success":value==="pending"?"warning":""}>{labels[value]||value}</Badge>;}
export function Notice({message}){return message?<div role="status" className="qm-notice">{message}</div>:null;}
export function ItemsTable({rows,review}){return <div className="qm-table-wrap"><table className="qm-table"><thead><tr><th>E’lon</th><th>Turi</th><th>Manba / hudud</th><th>Moderatsiya</th><th>Yaratilgan</th><th>Amallar</th></tr></thead><tbody>{rows.map(item=><tr key={item._id}><td><div className="qm-table-item"><ItemImage item={item}/><div><strong>{item.itemType||item.itemName||"Buyum"}</strong><small>#{item._id.slice(-7).toUpperCase()}</small></div></div></td><td><Badge>{item.status==="lost"?"Yo‘qolgan":"Topilgan"}</Badge></td><td><Source item={item}/><small>{item.region||"Hudud noma’lum"}</small></td><td><ModerationBadge value={item.moderationStatus}/></td><td>{dateOf(item.createdAt)}</td><td><Link className="qm-btn" href={review?"/admin/moderation?id="+item._id:"/desktop/item/"+item._id}><Eye size={12}/>Ko‘rish</Link></td></tr>)}</tbody></table></div>;}

