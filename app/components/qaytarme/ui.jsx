"use client";
import {useState} from "react";
import { Search, Package, MapPin, Link2, ShieldCheck, ArrowRight, Inbox, FileText, KeyRound, Smartphone, Car, Backpack, PawPrint } from "lucide-react";
export const categories = [
 ["all","Barchasi",Package],["docs","Hujjatlar",FileText],["tech","Elektronika",Smartphone],
 ["keys","Kalitlar",KeyRound],["wallet","Sumka va hamyon",Backpack],["vehicle","Transport",Car],["pets","Uy hayvonlari",PawPrint],
];
export function categoryLabel(key) { return categories.find(c=>c[0]===key)?.[1] || ({clothing:"Kiyim-kechak",jewelry:"Aksessuarlar",home:"Uy-ro‘zg‘or",sports:"Sport",toys:"O‘yinchoqlar",books:"Kitoblar",tools:"Asbob-uskunalar",food:"Boshqa buyumlar"})[key] || "Boshqa buyumlar"; }
export function imageOf(item) { const image=item?.image || item?.images?.[0]; return typeof image === "string" ? image : image?.url; }
export function dateOf(value) { const d=new Date(value); return Number.isNaN(d.getTime()) ? "Sana noma’lum" : d.toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Asia/Tashkent"}); }
export function Badge({children,tone=""}) { return <span className={"qm-badge "+tone}>{children}</span>; }
export function Empty({title="Hozircha ma’lumot yo‘q",text,children}) { return <div className="qm-empty"><Inbox size={32}/><h3>{title}</h3>{text && <p>{text}</p>}{children}</div>; }
export function Heading({eyebrow,title,text,children}) { return <div className="qm-heading"><div>{eyebrow && <div className="qm-eyebrow">{eyebrow}</div>}<h1>{title}</h1>{text && <p>{text}</p>}</div><div className="qm-heading-actions">{children}</div></div>; }
export function Panel({title,children,actions,className=""}) { return <section className={"qm-panel "+className}>{title && <div className="qm-panel-heading"><h2>{title}</h2>{actions}</div>}{children}</section>; }
export function ItemImage({item,className=""}) {
 const image=imageOf(item),[failed,setFailed]=useState(null);const Icon=categories.find(c=>c[0]===item?.category)?.[2] || Package;
 const hidden=item?.imageVisibility==='hidden',message=hidden?'Rasm maxfiylik sabab yashirilgan':image&&failed===image?'Rasmni yuklab bo‘lmadi':'Rasm qo‘shilmagan';
 return <div className={"qm-item-image "+className}>{image&&failed!==image?<><img src={image} alt={item.itemType || "Buyum"} loading="lazy" onError={()=>setFailed(image)}/>{item?.imageVisibility==='blurred'&&<span className="qm-image-blur-label">Maxfiy ma’lumotlar xiralashtirilgan</span>}</>:<div className="qm-image-placeholder"><Icon size={48} strokeWidth={1}/><span>{message}</span></div>}</div>;
}
export function Source({item}) { const p=item.provenance; return <span className="qm-source">{p?.sourceType === "telegram" ? <><Link2 size={12}/>{p.channelUsername ? "@"+p.channelUsername.replace(/^@/,"") : "Telegram"}</> : <><ShieldCheck size={12}/>Buyum Qidiruv</>}</span>; }
export {Search,Package,MapPin,ArrowRight};
