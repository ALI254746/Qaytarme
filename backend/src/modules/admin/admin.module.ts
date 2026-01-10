
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Ariza, ArizaSchema } from '../../schemas/ariza.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Message, MessageSchema } from '../../schemas/message.schema';
import { TelegramChannel, TelegramChannelSchema } from '../../schemas/telegram-channel.schema';

import { ChatGateway } from '../chat/chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ariza.name, schema: ArizaSchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: TelegramChannel.name, schema: TelegramChannelSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, ChatGateway],
})
export class AdminModule {}
