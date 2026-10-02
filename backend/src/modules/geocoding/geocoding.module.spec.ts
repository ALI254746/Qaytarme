import { GeocodingService } from './geocoding.module';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.module';
describe('Geoapify requests',()=>{
 const originalFetch=global.fetch;
 const setup=()=>new GeocodingService({get:()=> 'test-key'} as unknown as ConfigService,{enabled:false,key:(_scope:string,key:string)=>key} as unknown as RedisService);
 afterEach(()=>{global.fetch=originalFetch;});
 it('normalizes Shahrixon spelling, constrains Uzbekistan and caches results',async()=>{
  const request=jest.fn().mockResolvedValue({ok:true,json:async()=>({results:[{formatted:'Shahrixon',lat:40.7,lon:72.05,result_type:'city',rank:{confidence:1}}]})});global.fetch=request;
  const service=setup();await service.search('shaxrihon');await service.search('Shahrixon');
  expect(request).toHaveBeenCalledTimes(1);const url=request.mock.calls[0][0] as URL;
  expect(url.searchParams.get('text')).toBe('Shahrixon');expect(url.searchParams.get('filter')).toBe('countrycode:uz');
 });
 it('reverse geocodes a selected point and returns district metadata',async()=>{
  const request=jest.fn().mockResolvedValue({ok:true,json:async()=>({results:[{formatted:'School',lat:40.7,lon:72.05,county:'Shahrixon',country_code:'uz'}]})});global.fetch=request;
  const data=await setup().reverse(40.7,72.05);expect((request.mock.calls[0][0] as URL).pathname).toBe('/v1/geocode/reverse');expect(data.results[0].district).toBe('Shahrixon');
 });
 it('rejects invalid coordinates before calling the provider',async()=>{
  const request=jest.fn();global.fetch=request;await expect(setup().reverse(NaN,72)).rejects.toThrow();await expect(setup().reverse(0,0)).rejects.toThrow();expect(request).not.toHaveBeenCalled();
 });
 it('constrains named POIs to a resolved boundary',async()=>{
  const request=jest.fn().mockResolvedValue({ok:true,json:async()=>({features:[{properties:{name:'10 maktab',lat:40.7,lon:72.05,country_code:'uz'}}]})});global.fetch=request;
  const data=await setup().places('10 maktab','boundary-1');const url=request.mock.calls[0][0] as URL;expect(url.pathname).toBe('/v2/places');expect(url.searchParams.get('filter')).toBe('place:boundary-1');expect(data.results[0].confidence).toBeNull();
 });
});
