import {RedisService, RedisModule} from '../redis/redis.module';
import {Module,Injectable,Controller,Get,Query,UseGuards,BadRequestException,ServiceUnavailableException,HttpException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {RateLimit,RateLimitGuard} from '../../common/guards/rate-limit.guard';
@Injectable()
export class GeocodingService {
 private cache=new Map<string,{expires:number,data:any}>();
 private pending=new Map<string,Promise<any>>();
 private day='';private calls=0;private lastCall=0;
 constructor(private config:ConfigService, private redis:RedisService){}
 async search(raw:string){
  return this.cachedSearch(raw);
 }
 async reverse(lat:number,lng:number){
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<37||lat>46||lng<55||lng>74)throw new BadRequestException("O‘zbekiston hududidagi nuqtani tanlang.");
  return this.cachedSearch(`${lat.toFixed(5)},${lng.toFixed(5)}`,"reverse");
 }
 async places(name:string,placeId:string){
  return this.cachedSearch(name,"places",placeId);
 }
 private async cachedSearch(raw:string,kind="search",placeId=""){
  const text=String(raw||'').trim().replace(/\s+/g,' ').replace(/shaxrihon|shaxrixon|shahrihon/gi,'Shahrixon');
  if(text.length<3||text.length>150)throw new BadRequestException('Manzil 3–150 belgidan iborat bo‘lishi kerak.');
  const key=kind+":"+placeId+":"+text.toLowerCase();
  const sharedKey=this.redis.key('geo-cache', (this.config.get<string>('GEOAPIFY_API_KEY')||'')+':'+key);
  if(this.redis.enabled){try{const shared=await this.redis.get(sharedKey);if(shared)return JSON.parse(shared);}catch{throw new ServiceUnavailableException('Manzil qidirish keshi vaqtincha ishlamayapti.');}}
  else {const cached=this.cache.get(key);if(cached&&cached.expires>Date.now())return cached.data;}
  if(this.pending.has(key))return this.pending.get(key);
  const request=this.lookup(text,kind,placeId).then(async data=>{if(this.redis.enabled)await this.redis.set(sharedKey,data,86400);if(this.cache.size>=1000)this.cache.delete(this.cache.keys().next().value!);this.cache.set(key,{expires:Date.now()+86400000,data});return data;}).finally(()=>this.pending.delete(key));
  this.pending.set(key,request);return request;
 }
 private async lookup(text:string,kind:string,placeId:string){
  const apiKey=this.config.get<string>('GEOAPIFY_API_KEY');if(!apiKey)throw new ServiceUnavailableException('Manzil qidirish xizmati sozlanmagan.');
  if(this.redis.enabled){
   for(;;){let wait:number;try{wait=await this.redis.reserveGeoRequest(apiKey);}catch{throw new ServiceUnavailableException('Manzil qidirish limiti xizmati vaqtincha ishlamayapti.');}
    if(wait<0)throw new HttpException('Bugungi manzil qidirish limiti tugadi.',429);
    if(wait===0)break;await new Promise(resolve=>setTimeout(resolve,wait));
   }
  }else{
   const today=new Date().toISOString().slice(0,10);if(this.day!==today){this.day=today;this.calls=0;}
   while(Date.now()-this.lastCall<250)await new Promise(resolve=>setTimeout(resolve,250-(Date.now()-this.lastCall)));
   if(this.calls>=2800)throw new HttpException('Bugungi manzil qidirish limiti tugadi.',429);
   this.calls++;this.lastCall=Date.now();
  }
  const params:Record<string,string>={text,filter:'countrycode:uz',bias:'countrycode:uz',limit:'5',format:'json',apiKey};
  let endpoint='v1/geocode/search';
  if(kind==='reverse'){const [lat,lon]=text.split(',');delete params.text;delete params.filter;delete params.bias;params.lat=lat;params.lon=lon;endpoint='v1/geocode/reverse';}
  if(kind==='places'){endpoint='v2/places';delete params.text;delete params.format;delete params.bias;params.name=text;params.categories='education,commercial,healthcare,public_transport';params.filter='place:'+placeId;params.limit='10';}
  const url=new URL('https://api.geoapify.com/'+endpoint);url.search=new URLSearchParams(params).toString();
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new ServiceUnavailableException('Manzil qidirish xizmati vaqtincha ishlamayapti.');
   const body:any=await response.json();
   return {results:(body.results||body.features?.map((f:any)=>f.properties)||[]).filter((r:any)=>Number.isFinite(r.lat)&&Number.isFinite(r.lon)).map((r:any)=>({label:r.formatted||r.name,name:r.name||'',placeId:r.place_id||'',lat:r.lat,lng:r.lon,region:r.state||r.city||'',district:r.district||r.county||r.suburb||'',confidence:r.rank?.confidence??null,resultType:r.result_type||(kind==='places'?'amenity':''),countryCode:r.country_code||''})),attribution:'Powered by Geoapify | © OpenStreetMap contributors'};
  }catch{throw new ServiceUnavailableException('Manzilni qidirib bo‘lmadi. Birozdan keyin qayta urining.');}
 }
}
@Controller('geocoding')
@UseGuards(RateLimitGuard)
export class GeocodingController{
 constructor(private service:GeocodingService){}
 @Get('search') @RateLimit({limit:20,windowMs:60000})
 search(@Query('q')q:string){return this.service.search(q);}
 @Get('reverse') @RateLimit({limit:20,windowMs:60000})
 reverse(@Query('lat')lat:string,@Query('lng')lng:string){return this.service.reverse(Number(lat),Number(lng));}
}
@Module({imports:[RedisModule],controllers:[GeocodingController],providers:[GeocodingService],exports:[GeocodingService]})
export class GeocodingModule{}
