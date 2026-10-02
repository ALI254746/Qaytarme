import { Injectable } from '@nestjs/common';
import { GeocodingService } from './geocoding.module';

const clean = (value: unknown) => String(value || '').replace(/\+?\d[\d ()-]{7,}\d/g, '').replace(/\S+@\S+|https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().replace(/^unknown$/i, '');
const canonical = (value: string) => value.toLowerCase().replace(/shaxrixon|shahrihon/g, 'shahrixon').replace(/andijan/g, 'andijon').replace(/tashkent/g, 'toshkent').replace(/[^\p{L}\p{N}]/gu, '');

@Injectable()
export class TelegramLocationService {
 constructor(private geocoding: GeocodingService) {}
 async resolve(input: {region?: string; district?: string; location?: string; locationQueries?: string[]}, channel: {region?: string; username?: string; title?: string}) {
  let region = clean(input.region) || clean(channel.region);
  let district = clean(input.district);
  const context = canonical(`${channel.region || ''} ${channel.username || ''} ${channel.title || ''}`);
  if (!district && context.includes('shahrixon') && (!region || /andijon|shahrixon/.test(canonical(region)))) { district = 'Shahrixon'; region ||= 'Andijon'; }
  const location = clean(input.location);
  const unresolved = {region, district, location, coordinates: undefined, locationResolution: {provider: 'geoapify', precision: 'unresolved', approximate: true, confidence: null, matchedLabel: '', query: ''}};
  if (!location || (!region && !district)) return unresolved;
  const phrases = [...new Set([location, ...(Array.isArray(input.locationQueries) ? input.locationQueries : [])].map(clean).filter(Boolean))].slice(0, 3);
  for (const phrase of phrases) {
   const query = [phrase.slice(0, 95), district, region, 'Uzbekistan'].filter(Boolean).join(', ').slice(0, 150);
   try {
    const {results} = await this.geocoding.search(query);
    const candidates = results.filter((result: any) => {
     const label = canonical(result.label || '');
     const anchor = canonical(district || region);
     const numbers=phrase.match(/\d+/g)||[];
     const words=phrase.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3&&!['oldida','yonida','atrofida','maktab','school','guzaru','yonalishida','kocha','uzbekistan'].includes(w));
     const namedMatch=words.length===0||words.some(w=>label.includes(canonical(w)));
     const evidence=numbers.length ? numbers.every(n=>(String(result.name||result.label).match(/\d+/g)||[]).includes(n))&&namedMatch : words.length>0&&namedMatch;
     return evidence && label.includes(anchor) && Number(result.confidence) >= 0.75 && ['building', 'amenity', 'street', 'suburb'].includes(result.resultType) && result.lat >= 37 && result.lat <= 46 && result.lng >= 55 && result.lng <= 74;
    });
    let match=candidates.length===1?candidates[0]:undefined;
    if(!match && !candidates.length && /maktab|school|bekat|bozor|masjid/i.test(phrase)){
     const areaQuery=[district,region,"Uzbekistan"].filter(Boolean).join(", ");
     const areaResults=await this.geocoding.search(areaQuery);
     const area=areaResults.results.find((r:any)=>["city","district","county","suburb"].includes(r.resultType)&&canonical(r.label||"").includes(canonical(district||region))&&r.placeId&&Number(r.confidence)>=0.75);
     if(area){
      const places=await this.geocoding.places(phrase,area.placeId);
      const exact=places.results.filter((r:any)=>r.countryCode==="uz"&&canonical(r.name||"")===canonical(phrase)&&r.lat>=37&&r.lat<=46&&r.lng>=55&&r.lng<=74);
      if(exact.length===1)match=exact[0];
     }
    }
    if (match) return {...unresolved, coordinates: {lat: match.lat, lng: match.lng}, locationResolution: {provider: 'geoapify', precision: match.resultType, approximate: true, confidence: match.confidence, matchedLabel: match.label, query}};
   } catch { return unresolved; }
  }
  return unresolved;
 }
}
