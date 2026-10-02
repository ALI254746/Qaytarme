import {telegramBatchKey,isLostFoundPost} from './telegram-post.util';
describe('Telegram post boundaries',()=>{
 it('does not merge separate consecutive posts',()=>{expect(telegramBatchKey({id:10})).not.toBe(telegramBatchKey({id:11}));});
 it('groups photos of the same album',()=>{expect(telegramBatchKey({id:10,groupedId:'1024'})).toBe(telegramBatchKey({id:11,groupedId:'1024'}));});
 it('does not group different albums',()=>{expect(telegramBatchKey({id:10,groupedId:'1024'})).not.toBe(telegramBatchKey({id:11,groupedId:'1025'}));});
 it('accepts Uzbek and Russian lost/found posts',()=>{expect(isLostFoundPost("Qora sumka yo‘qolgan, Yunusobod")).toBe(true);expect(isLostFoundPost('Найден паспорт, обратитесь')).toBe(true);});
 it('does not import unrelated channel news',()=>{expect(isLostFoundPost('Bugun futbol o‘yini, jamoamiz g‘alaba qozondi')).toBe(false);});
});

