import { TelegramLocationService } from './telegram-location.service';
import { GeocodingService } from './geocoding.module';

describe('Telegram location resolution', () => {
 const setup = (results: any[]) => {
  const search = jest.fn().mockResolvedValue({results});
  return {search, service: new TelegramLocationService({search} as unknown as GeocodingService)};
 };
 const school = {label: '10 maktab, Shahrixon, Andijon, Uzbekistan', lat: 40.7, lng: 72.05, confidence: 0.9, resultType: 'amenity'};
 it('uses channel locality and removes contact details from the search', async () => {
  const {service,search} = setup([school]);
  const result = await service.resolve({location: '10 maktab +998701831011'}, {username: 'Shahrixon_topilmalari'});
  expect(search.mock.calls[0][0]).toContain('Shahrixon');
  expect(search.mock.calls[0][0]).not.toContain('998701831011');
  expect(result.coordinates).toEqual({lat: 40.7, lng: 72.05});
  expect(result.locationResolution.approximate).toBe(true);
 });
 it.each([
  {...school, label: '10 maktab, Toshkent'},
  {...school, resultType: 'city'},
  {...school, confidence: 0.4},
  {...school,label:'11 maktab, Shahrixon, Andijon, Uzbekistan'},
 ])('does not plot the wrong town, broad area or uncertain result', async candidate => {
  const {service} = setup([candidate]);
  expect((await service.resolve({location: '10 maktab'}, {username:'Shahrixon_topilmalari'})).coordinates).toBeUndefined();
 });
 it('leaves ambiguous same-number schools unresolved',async()=>{
  const {service}=setup([school,{...school,lat:40.8}]);
  expect((await service.resolve({location:'10 maktab'},{username:'Shahrixon_topilmalari'})).coordinates).toBeUndefined();
 });
 it('checks the named neighborhood as well as the school number',async()=>{
  const {service}=setup([school]);
  expect((await service.resolve({location:'Qayrogoch 10 maktab'},{username:'Shahrixon_topilmalari'})).coordinates).toBeUndefined();
 });
 it('uses a unique named POI within the resolved district boundary',async()=>{
  const search=jest.fn().mockResolvedValueOnce({results:[]}).mockResolvedValueOnce({results:[{...school,resultType:'city',placeId:'district-1'}]});
  const places=jest.fn().mockResolvedValue({results:[{...school,name:'10 maktab',countryCode:'uz',confidence:null}]});
  const service=new TelegramLocationService({search,places} as unknown as GeocodingService);
  const result=await service.resolve({location:'10 maktab'},{username:'Shahrixon_topilmalari'});
  expect(places).toHaveBeenCalledWith('10 maktab','district-1');
  expect(result.coordinates).toEqual({lat:40.7,lng:72.05});
  expect(result.locationResolution.confidence).toBeNull();
 });
 it('keeps explicit conflicting locality ahead of channel context', async () => {
  const {service,search} = setup([]);
  const result = await service.resolve({region:'Toshkent', location:'10 maktab'}, {username:'Shahrixon_topilmalari'});
  expect(result.district).toBe('');
  expect(search.mock.calls[0][0]).not.toContain('Shahrixon');
 });
 it('preserves the listing if the provider fails', async () => {
  const {service,search} = setup([]); search.mockRejectedValue(new Error('offline'));
  const result = await service.resolve({location:'10 maktab'}, {username:'Shahrixon_topilmalari'});
  expect(result.locationResolution.precision).toBe('unresolved');
  expect(result.coordinates).toBeUndefined();
 });
});
