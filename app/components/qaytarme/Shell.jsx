"use client";
import Link from "next/link";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useSession,signOut} from "next-auth/react";
import {useEffect,useRef,useState} from "react";
import {Search,Home,ClipboardList,PlusCircle,Link2,MessageSquare,Map,Bell,UserRound,Settings,LogOut,Bookmark,Menu,X,ArrowUpRight,ShieldCheck,LifeBuoy,ChevronDown} from "lucide-react";
import NotificationCenter from "../NotificationCenter";
const nav=[
 ["/desktop","Bosh sahifa",Home],["/desktop/listings","E’lonlar",ClipboardList],
 ["/desktop/add","E’lon berish",PlusCircle],["/desktop/matches","Mos kelganlar",Link2],
 ["/desktop/messages","Xabarlar",MessageSquare],["/desktop/map","Xarita",Map],
 ["/desktop/saved","Saqlanganlar",Bookmark],["/desktop/notifications","Bildirishnomalar",Bell],
 ["/desktop/my-items","Mening e’lonlarim",ClipboardList],["/desktop/profile","Profil",UserRound],
];
export default function Shell({children}) {
 const pathname=usePathname(),router=useRouter(),params=useSearchParams();
 const {data:session,status:sessionStatus}=useSession();
 const [query,setQuery]=useState(params.get("q")||""),[open,setOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[signingOut,setSigningOut]=useState(false),[accountError,setAccountError]=useState("");
 const accountRef=useRef(null),accountButtonRef=useRef(null),firstAccountLinkRef=useRef(null);
 const privateRoutes=["/desktop/add","/desktop/matches","/desktop/messages","/desktop/saved","/desktop/notifications","/desktop/my-items","/desktop/profile","/desktop/settings"];
 const requiresLogin=privateRoutes.some(path=>pathname===path||pathname.startsWith(path+"/"));
 const queryString=params.toString();
 const returnPath=pathname+(queryString?"?"+queryString:"");
 const guestNavPaths=new Set(["/desktop","/desktop/listings","/desktop/map"]);
 useEffect(()=>{setQuery(params.get("q")||"");},[params]);
 useEffect(()=>{if(requiresLogin&&sessionStatus==="unauthenticated")router.replace("/login?callbackUrl="+encodeURIComponent(returnPath));},[requiresLogin,sessionStatus,router,returnPath]);
 useEffect(()=>{setAccountOpen(false);},[pathname]);
 useEffect(()=>{if(!accountOpen)return;const closeOutside=e=>{if(!accountRef.current?.contains(e.target))setAccountOpen(false);};const closeEscape=e=>{if(e.key==="Escape"){setAccountOpen(false);accountButtonRef.current?.focus();}};document.addEventListener("pointerdown",closeOutside);document.addEventListener("keydown",closeEscape);firstAccountLinkRef.current?.focus();return()=>{document.removeEventListener("pointerdown",closeOutside);document.removeEventListener("keydown",closeEscape);};},[accountOpen]);
 async function handleSignOut(){setSigningOut(true);setAccountError("");try{const result=await signOut({redirect:false,callbackUrl:"/login"});window.location.assign(result?.url||"/login");}catch{setSigningOut(false);setAccountError("Hisobdan chiqib bo‘lmadi. Qayta urinib ko‘ring.");}}
 const map=pathname==="/desktop/map",messages=pathname==="/desktop/messages";
 if(requiresLogin&&sessionStatus!=="authenticated")return <main className="qm-auth-gate"><div><span className="qm-brand-mark"><UserRound size={22}/></span><h1>{sessionStatus==="loading"?"Kirish holati tekshirilmoqda":"Hisobga kirish kerak"}</h1><p>{sessionStatus==="loading"?"Shaxsiy sahifangiz yuklanmoqda…":"Bu sahifa shaxsiy hisobingiz uchun. Davom etish uchun tizimga kiring."}</p>{sessionStatus==="unauthenticated"&&<Link className="qm-btn qm-btn-dark" href={"/login?callbackUrl="+encodeURIComponent(returnPath)}>Kirish yoki ro‘yxatdan o‘tish <ArrowUpRight size={14}/></Link>}<Link className="qm-auth-back" href="/desktop">Bosh sahifaga qaytish</Link></div></main>;
 const visibleNav=nav.filter(([href])=>sessionStatus==="authenticated"||guestNavPaths.has(href));
 return <div className="qm-app">
  {open && <button className="qm-scrim" aria-label="Menyuni yopish" onClick={()=>setOpen(false)}/>}
  <aside className={"qm-sidebar "+(open?"is-open":"")}>
   <Link href="/desktop" className="qm-brand"><span className="qm-brand-mark"><Search size={25} strokeWidth={2.7}/></span><span><strong>Buyum Qidiruv</strong><small>Yo‘qotganingiz qaytsin</small></span></Link>
   <button className="qm-mobile-close" aria-label="Menyuni yopish" onClick={()=>setOpen(false)}><X size={18}/></button>
   <nav>{visibleNav.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={pathname===href?"active":""} aria-current={pathname===href?"page":undefined}><Icon size={18}/><span>{label}</span></Link>)}</nav>
   <div className="qm-sidebar-bottom">
    {session?.user?.role==="admin" && <Link href="/admin"><ShieldCheck size={18}/>Boshqaruv paneli<ArrowUpRight size={13}/></Link>}
    <Link href="/desktop/about"><LifeBuoy size={18}/>Yordam</Link>{session&&<Link href="/desktop/settings"><Settings size={18}/>Sozlamalar</Link>}
    {session ? <button onClick={()=>signOut({callbackUrl:"/"})}><LogOut size={18}/>Chiqish</button> : <Link href="/login"><LogOut size={18}/>Hisobga kirish</Link>}
   </div>
   <div className="qm-sidebar-note"><span className="qm-dot"/> O‘zbekiston bo‘ylab birga izlaymiz</div>
  </aside>
  <div className="qm-main">
   <header className="qm-topbar">
    <button className="qm-menu-btn" aria-label="Menyuni ochish" onClick={()=>setOpen(true)}><Menu size={20}/></button>
    <form className="qm-top-search" onSubmit={e=>{e.preventDefault();const value=query.trim();router.push("/desktop/listings"+(value?"?q="+encodeURIComponent(value):""));}}><button type="submit" className="qm-top-search-submit" aria-label="Qidirishni boshlash"><Search size={17}/></button><input aria-label="E’lonlarni qidirish" placeholder="Buyum, joy yoki kalit so‘z orqali qidiring..." value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" className="qm-top-search-submit" aria-label="Qidirish"><kbd>↵</kbd></button></form>
    <div className="qm-top-actions">{session && <NotificationCenter/>}{session ? <div className="qm-account-wrap" ref={accountRef}><button ref={accountButtonRef} type="button" className="qm-user" aria-haspopup="dialog" aria-expanded={accountOpen} aria-label={`Hisob menyusi: ${session.user.name || "Foydalanuvchi"}`} onClick={()=>setAccountOpen(v=>!v)}><span className="qm-avatar"><UserRound size={20}/></span><span><small>Salom,</small><strong>{session.user.name || "Foydalanuvchi"}</strong></span><ChevronDown size={13}/></button>{accountOpen&&<div className="qm-account-popover" role="dialog" aria-label="Hisob menyusi"><div className="qm-account-identity"><span className="qm-avatar"><UserRound size={20}/></span><span><strong>{session.user.name||"Foydalanuvchi"}</strong><small>{session.user.email||"Buyum Qidiruv foydalanuvchisi"}</small></span></div><div className="qm-account-links"><Link ref={firstAccountLinkRef} href="/desktop/profile" onClick={()=>setAccountOpen(false)}><UserRound size={16}/>Profilim</Link><Link href="/desktop/my-items" onClick={()=>setAccountOpen(false)}><ClipboardList size={16}/>Mening e’lonlarim</Link><Link href="/desktop/messages" onClick={()=>setAccountOpen(false)}><MessageSquare size={16}/>Xabarlar</Link><Link href="/desktop/saved" onClick={()=>setAccountOpen(false)}><Bookmark size={16}/>Saqlanganlar</Link><Link href="/desktop/settings" onClick={()=>setAccountOpen(false)}><Settings size={16}/>Sozlamalar</Link>{session.user.role==="admin"&&<Link href="/admin" onClick={()=>setAccountOpen(false)}><ShieldCheck size={16}/>Boshqaruv paneli</Link>}</div><div className="qm-account-footer">{accountError&&<p className="qm-account-error" role="alert">{accountError}</p>}<button type="button" onClick={handleSignOut} disabled={signingOut}>{signingOut?<><span className="qm-account-spinner" aria-hidden="true"/>Hisobdan chiqilmoqda…</>:<><LogOut size={16}/>Chiqish</>}</button></div></div>}</div> : <Link className="qm-btn qm-btn-dark" href="/login">Kirish <ArrowUpRight size={14}/></Link>}</div>
   </header>
   <main className={map?"qm-content-map":messages?"qm-content-messages":"qm-content"}>{children}</main>
  </div>
 </div>;
}
