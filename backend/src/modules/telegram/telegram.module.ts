import {RedisModule} from '../redis/redis.module';
import {TelegramQueueService} from './telegram-queue.service';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { TelegramLocationService } from '../geocoding/telegram-location.service';
import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramProvenanceConnector } from './telegram-provenance.connector';
import { ArizaModule } from '../ariza/ariza.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramChannel, TelegramChannelSchema } from '../../schemas/telegram-channel.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    GeocodingModule,
    ArizaModule,
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: TelegramChannel.name, schema: TelegramChannelSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [TelegramQueueService, TelegramLocationService, TelegramService, TelegramProvenanceConnector],
  exports: [TelegramService],
})
export class TelegramModule {}
