
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('unread-count')
  async getTotalUnreadCount(@Req() req: any) {
    const count = await this.chatService.getTotalUnreadCount(req.user.id);
    return { count };
  }

  @Get(':userId')
  async getChatHistory(@Req() req: any, @Param('userId') otherUserId: string) {
    return this.chatService.getChatHistory(req.user.id, otherUserId);
  }

  @Post()
  async sendMessage(
    @Req() req: any,
    @Body() body: { recipientId: string; content: string; itemId?: string },
  ) {
    return this.chatService.sendMessage(
      req.user.id,
      body.recipientId,
      body.content,
      body.itemId,
    );
  }
}
