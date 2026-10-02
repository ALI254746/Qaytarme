"use client";
import {useCallback,useEffect,useState} from "react";
import {useSession} from "next-auth/react";
import {getApiUrl} from "@/lib/api-config";
export async function adminRequest(path,token,body,method){
 const r=await fetch(getApiUrl("operations/"+path),{method:method||(body?"POST":"GET"),headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();if(!r.ok)throw Error(Array.isArray(data.message)?data.message.join(", "):data.message||"So‘rov bajarilmadi.");return data;
}
export function useAdminData(path){
 const {data:session}=useSession(),token=session?.user?.accessToken;
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const refresh=useCallback(async()=>{if(!token)return;setLoading(true);setError("");try{setData(await adminRequest(path,token));}catch(e){setError(e.message);}finally{setLoading(false);}},[path,token]);
 useEffect(()=>{refresh();},[refresh]);return {data,loading,error,refresh,token};
}
export function downloadJson(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=name+".json";a.click();URL.revokeObjectURL(url);}

