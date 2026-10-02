"use client";
import {Send,ShieldCheck} from "lucide-react";
export function MessageInput({value,onChange,onSubmit,disabled,error}) {
 return <form className="qm-chat-composer" onSubmit={onSubmit}><div className="qm-composer-row">
  <textarea value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}} rows={1} maxLength={3000} disabled={disabled} placeholder={disabled?"Suhbat yopilgan":"Xabar yozing…"} aria-label="Xabar matni"/>
  <span className="qm-composer-shield" title="Shaxsiy ma’lumotlarni yubormang"><ShieldCheck size={19}/></span>
  <button type="submit" disabled={disabled||!value.trim()} aria-label="Xabar yuborish"><Send size={19}/></button>
 </div>{error&&<p className="qm-chat-error" role="alert">{error}</p>}</form>;
}
