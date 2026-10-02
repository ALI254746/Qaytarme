"use client";
import {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {Search,ArrowRight,Users,Send} from "lucide-react";
import {Heading,Panel,Empty,Badge} from "../../components/qaytarme/ui";
import {useAdminData} from "../../components/qaytarme/admin-api";
import {State,ItemsTable} from "../../components/qaytarme/AdminShared";
function SearchResults(){
 const params=useSearchParams(),q=(params.get('q')||'').trim(),term=q.toLocaleLowerCase();
 const items=useAdminData('items'),users=useAdminData('users'),channels=useAdminData('channels');
 const match=values=>term&&values.join(' ').toLocaleLowerCase().includes(term);
 const foundItems=(items.data||[]).filter(i=>match([i.itemType,i.itemDescription,i._id,i.user?.name,i.region]));
 const foundUsers=(users.data||[]).filter(u=>match([u.name,u.email,u._id]));
 const sourceRows=Array.isArray(channels.data)?channels.data:channels.data?.channels||[];
 const foundChannels=sourceRows.filter(c=>match([c.username,c.description,c.region,c._id]));
 return <><Heading title="Qidiruv natijalari" text={q?`«${q}» — e’lonlar, foydalanuvchilar va Telegram manbalari`:'Yuqoridagi maydonga qidiruv so‘zini kiriting.'}/><State loading={items.loading||users.loading||channels.loading} error={items.error||users.error||channels.error} refresh={()=>{items.refresh();users.refresh();channels.refresh();}}/>{q&&<><Panel title="E’lonlar" actions={<Badge>{foundItems.length}</Badge>}><ItemsTable rows={foundItems} review/>{!items.loading&&!foundItems.length&&<Empty title="E’lon topilmadi"/>}</Panel><div className="qm-admin-search-grid"><Panel title="Foydalanuvchilar" actions={<Badge>{foundUsers.length}</Badge>}><div className="qm-admin-search-list">{foundUsers.map(u=><Link key={u._id} href={'/admin/users?q='+encodeURIComponent(u.email||u.name)}><Users size={18}/><span><strong>{u.name}</strong><small>{u.email}</small></span><ArrowRight size={15}/></Link>)}</div>{!users.loading&&!foundUsers.length&&<Empty title="Foydalanuvchi topilmadi"/>}</Panel><Panel title="Telegram manbalari" actions={<Badge>{foundChannels.length}</Badge>}><div className="qm-admin-search-list">{foundChannels.map(c=><Link key={c._id} href="/admin/telegram-channels"><Send size={18}/><span><strong>{c.username}</strong><small>{c.region||'Hudud ko‘rsatilmagan'}</small></span><ArrowRight size={15}/></Link>)}</div>{!channels.loading&&!foundChannels.length&&<Empty title="Kanal topilmadi"/>}</Panel></div></>}</>;
}
export default function Page(){return <Suspense fallback={<div className="qm-loading">Yuklanmoqda…</div>}><SearchResults/></Suspense>;}
