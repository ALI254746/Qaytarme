import {Global, Injectable, Logger, Module, OnModuleDestroy, ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import Redis from 'ioredis';
import {createHash} from 'crypto';

@Injectable()
export class RedisService implements OnModuleDestroy {
 private client?: Redis;
 private logger = new Logger(RedisService.name);
 constructor(private config: ConfigService) {}
 get enabled() { return !!this.config.get<string>('REDIS_URL'); }
 get prefix() { return this.config.get<string>('REDIS_PREFIX') || 'qaytarme'; }
 connection(worker = false) {
  const url = this.config.get<string>('REDIS_URL');
  if (!url || !/^rediss?:\/\//.test(url)) throw new ServiceUnavailableException('Redis ulanish manzili sozlanmagan.');
  const client = new Redis(url, {maxRetriesPerRequest: worker ? null : 1, connectTimeout: 5000, lazyConnect: true, enableOfflineQueue: worker});
  client.on('error', () => this.logger.warn('Redis ulanishida xato.'));
  return client;
 }
 private async ready() {
  this.client ||= this.connection();
  if (this.client.status === 'wait') await this.client.connect();
  return this.client;
 }
 key(scope: string, value: string) { return `${this.prefix}:${scope}:${createHash('sha256').update(value).digest('hex')}`; }
 async get(key: string) { return (await this.ready()).get(key); }
 async set(key: string, value: unknown, seconds: number) { await (await this.ready()).set(key, JSON.stringify(value), 'EX', seconds); }
 async reserveGeoRequest(apiKey: string) {
  const client = await this.ready();
  const bucket = this.key('geo-limit', apiKey);
  const result = await client.eval(`
   local t = redis.call('TIME')
   local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2])/1000)
   local day = math.floor(tonumber(t[1])/86400)
   local quotaKey = KEYS[1] .. ':' .. day
   local count = tonumber(redis.call('GET', quotaKey) or '0')
   if count >= tonumber(ARGV[1]) then return -1 end
   local last = tonumber(redis.call('GET', KEYS[2]) or '0')
   if now-last < 250 then return 250-(now-last) end
   redis.call('INCR', quotaKey)
   redis.call('EXPIRE', quotaKey, 172800)
   redis.call('SET', KEYS[2], now, 'PX', 1000)
   return 0
  `, 2, bucket, bucket + ':last', '2800');
  return Number(result);
 }
 async onModuleDestroy() { this.client?.disconnect(); }
}
@Global()
@Module({providers:[RedisService],exports:[RedisService]})
export class RedisModule {}
