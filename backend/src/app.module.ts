import {RedisModule} from './modules/redis/redis.module';

import { Module } from '@nestjs/common';
import { GeocodingModule } from './modules/geocoding/geocoding.module';
import { OperationsModule } from './modules/operations/operations.module';
import { SettingsModule } from './modules/operations/settings.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArizaModule } from './modules/ariza/ariza.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ChatModule } from './modules/chat/chat.module';
import { MailModule } from './modules/mail/mail.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';
import { AboutModule } from './modules/about/about.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TranslationModule } from './modules/translation/translation.module';
import { SourceReliabilityModule } from './modules/source-reliability/source-reliability.module';
import { GeoIntelligenceModule } from './modules/geo-intelligence/geo-intelligence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: 'lostfound',
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    SettingsModule,
    GeocodingModule,
    OperationsModule,
    AuthModule,
    UsersModule,
    ArizaModule,
    MatchesModule,
    ChatModule,
    MailModule,
    CloudinaryModule,
    AdminModule,
    AboutModule,
    TelegramModule,
    TranslationModule,
    SourceReliabilityModule,
    GeoIntelligenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
