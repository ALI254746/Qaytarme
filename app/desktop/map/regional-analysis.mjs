const DAY=86400000;
export function validCoordinates(item){
 const lat=Number(item.coordinates?.lat),lng=Number(item.coordinates?.lng);
 return item.coordinates?.lat!=null&&item.coordinates?.lng!=null&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=37&&lat<=46&&lng>=55.9&&lng<=73.2?[lat,lng]:null;
}
export function regionName(value){
 const text=String(value||"").trim();
 if(!text||/^(unknown|noma.?lum|null|undefined)$/i.test(text))return "";
 const aliases={tashkent:"Toshkent", "tashkent city":"Toshkent shahri", "tashkent region":"Toshkent viloyati","andijan region":"Andijon viloyati","andijan":"Andijon","namangan region":"Namangan viloyati","fergana region":"Farg‘ona viloyati", "samarkand region":"Samarqand viloyati"};
 return aliases[text.toLowerCase()]||text;
}
export function areaFor(item){const region=regionName(item.region),district=regionName(item.district);return region||district?{key:[region,district].filter(Boolean).join(" / "),region,district,name:district||region}:null;}
export function timestamp(item){const raw=item.occurredAt||item.provenance?.publishedAt||item.createdAt;const time=raw?new Date(raw).getTime():NaN;return Number.isFinite(time)?time:null;}
export function buildRegionalAnalysis(items,{days=30,status="all",category="all",source="all",query="",now=Date.now()}={}){
 const eligible=items.filter(i=>(status==="all"||i.status===status)&&(category==="all"||i.category===category)&&(source==="all"||(source==="telegram"?i.provenance?.sourceType==="telegram":i.provenance?.sourceType!=="telegram")));
 const duration=days==="all"?null:Number(days)*DAY,from=duration?now-duration:null,previousFrom=duration?now-2*duration:null;
 const matchesTime=i=>{const time=timestamp(i);return !duration||time!=null&&time>=from&&time<=now;};
 const current=eligible.filter(matchesTime),previous=duration?eligible.filter(i=>{const t=timestamp(i);return t!=null&&t>=previousFrom&&t<from;}):[];
 const groups=new Map();
 for(const item of current){
  const area=areaFor(item);if(!area)continue;
  if(!groups.has(area.key))groups.set(area.key,{...area,items:[],lost:0,found:0,categories:{},channels:new Set(),coordinates:[],previous:0});
  const g=groups.get(area.key);g.items.push(item);if(item.status==="lost")g.lost++;if(item.status==="found")g.found++;g.categories[item.category||"other"]=(g.categories[item.category||"other"]||0)+1;
  if(item.provenance?.sourceType==="telegram"&&item.provenance?.channelUsername)g.channels.add(item.provenance.channelUsername.replace(/^@/,"").toLowerCase());
  const coordinate=validCoordinates(item);if(coordinate)g.coordinates.push(coordinate);
 }
 for(const item of previous){const area=areaFor(item);if(area&&groups.has(area.key))groups.get(area.key).previous++;}
 const q=query.trim().toLowerCase();
 const areas=[...groups.values()].map(g=>({...g,count:g.items.length,channels:[...g.channels],categories:Object.entries(g.categories).sort((a,b)=>b[1]-a[1]),center:g.coordinates.length?[g.coordinates.reduce((n,c)=>n+c[0],0)/g.coordinates.length,g.coordinates.reduce((n,c)=>n+c[1],0)/g.coordinates.length]:null,suppressed:g.items.length<5,trend:duration&&g.previous>0?Math.round((g.items.length-g.previous)/g.previous*100):null})).filter(g=>!q||[g.key,...g.categories.map(c=>c[0])].join(" ").toLowerCase().includes(q)).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 return {areas,current,unknown:current.filter(i=>!areaFor(i)).length,unknownDate:eligible.filter(i=>timestamp(i)==null).length,suppressed:areas.filter(g=>g.suppressed).length,withSources:areas.filter(g=>g.channels.length>0).length,unlocated:areas.filter(g=>!g.center).length};
}

