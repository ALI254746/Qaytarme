"use client";
import {Check,CheckCheck,ShieldCheck,UserRound} from "lucide-react";
import {useEffect,useRef} from "react";
const time=value=>new Intl.DateTimeFormat('uz-UZ',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
function dateLabel(value){const d=new Date(value);return d.toDateString()===new Date().toDateString()?'Bugun':d.toLocaleDateString('uz-UZ',{day:'numeric',month:'long'});}
export function ChatMessages({messages,currentUserId,otherUserId,typing,loading}) {
 const endRef=useRef(null);
 useEffect(()=>{endRef.current?.scrollIntoView({block:'end',behavior:'smooth'});},[messages.length,typing]);
 if(loading)return <div className="qm-chat-loading">Xabarlar yuklanmoqda…</div>;
 return <div className="qm-message-history" role="log" aria-label="Suhbat xabarlari">
  <p className="qm-chat-safety"><ShieldCheck size={14}/>Shaxsiy ma’lumotlarni yubormang. Uchrashuvni jamoat joyida belgilang.</p>
  {!messages.length&&<p className="qm-chat-empty-message">Suhbat boshlandi. Birinchi xabarni yozing.</p>}
  {messages.map((message,index)=>{const mine=message.senderId===currentUserId;const read=mine&&message.readBy?.some(entry=>entry.userId===otherUserId);const showDate=index===0||new Date(messages[index-1].createdAt).toDateString()!==new Date(message.createdAt).toDateString();return <div key={message.id}>
   {showDate&&<div className="qm-message-date"><span>{dateLabel(message.createdAt)}</span></div>}
   <div className={'qm-message-row '+(mine?'is-mine':'')}>
    {!mine&&<span className="qm-message-avatar"><UserRound size={22}/></span>}
    <article className="qm-message-bubble"><p>{message.body}</p><div className="qm-message-meta"><time dateTime={message.createdAt}>{time(message.createdAt)}</time>{mine&&(read?<CheckCheck size={13} aria-label="O‘qildi"/>:<Check size={13} aria-label="Yuborildi"/>)}</div></article>
   </div></div>;})}
  {typing&&<p className="qm-chat-typing">Suhbatdoshingiz yozmoqda…</p>}<div ref={endRef}/>
 </div>;
}
