"use client";
import Link from "next/link";
import {ArrowLeft,UserRound} from "lucide-react";
export function ChatHeader({conversation,connected,onBack}) {
 const {user,item}=conversation;
 return <header className="qm-conversation-header">
  <button type="button" className="qm-chat-back" onClick={onBack} aria-label="Suhbatlar ro‘yxatiga qaytish"><ArrowLeft size={18}/></button>
  <span className="qm-person-avatar">{user.avatar?<img src={user.avatar} alt=""/>:<UserRound size={24}/>}</span>
  <div className="qm-conversation-person"><h2>{user.name}</h2><p>{connected?"Ulangan":"Qayta ulanmoqda…"}</p></div>
  {item&&<div className="qm-chat-header-item"><span className="qm-chat-thumbnail">{item.imageUrl?<img src={item.imageUrl} alt=""/>:<span>□</span>}</span><span><small>{item.status==="lost"?"Yo‘qolgan":"Topilgan"}</small><strong>{item.itemType||item.itemName||"Buyum"}</strong></span><Link href={"/desktop/item/"+item.id}>E’lonni ko‘rish</Link></div>}
 </header>;
}
