import {Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import {Queue, Worker} from 'bullmq';
import type Redis from 'ioredis';
import {createHash} from 'crypto';
import {RedisService} from '../redis/redis.module';

export interface TelegramJob {username: string; title: string; messageIds: number[];}
@Injectable()
export class TelegramQueueService implements OnModuleDestroy {
 private queue?: Queue;
 private worker?: Worker;
 private connections: Redis[] = [];
 private readonly logger = new Logger(TelegramQueueService.name);
 constructor(private redis: RedisService) {}
 get enabled() { return this.redis.enabled; }
 private producer() {
  if (!this.queue) {
   const connection = this.redis.connection(); this.connections.push(connection);
   this.queue = new Queue('telegram-analysis', {connection, prefix: this.redis.prefix,
    defaultJobOptions: {attempts: 4, backoff: {type:'exponential',delay:5000}, removeOnComplete:{age:86400,count:1000}, removeOnFail:{age:604800,count:1000}}});
   this.queue.on('error', () => this.logger.warn('Telegram navbati Redis bilan bog‘lana olmadi.'));
  }
  return this.queue;
 }
 async enqueue(data: TelegramJob) {
  const ids = [...new Set(data.messageIds)].sort((a,b)=>a-b);
  const jobId = createHash('sha256').update(data.username.toLowerCase()+':'+ids.join(',')).digest('hex');
  await this.producer().add('analyse', {...data,messageIds:ids}, {jobId});
 }
 async start(processor: (data: TelegramJob) => Promise<void>) {
  if (!this.enabled || this.worker) return;
  await this.producer().setGlobalConcurrency(1);
  const connection = this.redis.connection(true); this.connections.push(connection);
  this.worker = new Worker<TelegramJob>('telegram-analysis', job => processor(job.data), {connection, prefix:this.redis.prefix, concurrency:1});
  this.worker.on('error', () => this.logger.warn('Telegram worker ulanishida xato.'));
  this.worker.on('failed', job => this.logger.warn(`Telegram tahlili qayta uriniladi yoki navbatda xato sifatida saqlanadi: ${job?.id}`));
  this.logger.log('Telegram AI va joylashuv tahlili Redis navbatiga ulandi.');
 }
 async onModuleDestroy() {
  await this.worker?.close(); await this.queue?.close();
  this.connections.forEach(connection => connection.disconnect());
 }
}
