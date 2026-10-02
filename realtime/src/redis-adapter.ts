import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'socket.io';

export async function configureRedisAdapter(io: Server) {
 const url = process.env.REDIS_URL;
 if (!url) { console.log('Redis sozlanmagan: chat bitta server rejimida.'); return; }
 if (!/^rediss?:\/\//.test(url)) throw new Error('REDIS_URL Redis ulanish manzili bo‘lishi kerak.');
 const pub = new Redis(url, {lazyConnect: true, connectTimeout: 5000, maxRetriesPerRequest: 1});
 const sub = pub.duplicate();
 const report = () => console.error('Chat Redis ulanishida xato.');
 pub.on('error', report); sub.on('error', report);
 try { await Promise.all([pub.connect(), sub.connect()]); }
 catch { pub.disconnect(); sub.disconnect(); throw new Error('Chat Redis serveriga ulanib bo‘lmadi.'); }
 io.adapter(createAdapter(pub, sub, {key: `${process.env.REDIS_PREFIX || 'qaytarme'}:socket`}));
 const shutdown = async () => {
  await new Promise<void>(resolve => io.close(() => resolve()));
  await Promise.all([pub.quit(), sub.quit()].map(request => request.catch(() => undefined)));
 };
 process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
 console.log('Chat Redis adapteri ulandi.');
}
