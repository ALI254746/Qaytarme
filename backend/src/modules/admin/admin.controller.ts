
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getStats();
  }

  @Get('recent-activity')
  async getRecentActivity(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getRecentActivity();
  }

  @Get('items')
  async getItems(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAllItems();
  }

  @Post('items/moderation')
  async updateItemStatus(@Req() req: any, @Body() body: { id: string, moderationStatus: string }) {
    this.checkAdmin(req);
    return this.adminService.updateItemStatus(body.id, body.moderationStatus);
  }

  @Delete('items/:id')
  async deleteItem(@Req() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteItem(id);
  }

  @Get('users')
  async getUsers(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteUser(id);
  }

  @Get('detailed-stats')
  async getDetailedStats(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getDetailedStats();
  }

  // Any authenticated user can contact admin
  @Post('contact')
  async contactAdmin(@Req() req: any, @Body() body: { message: string }) {
      return this.adminService.notifyAdmins(req.user.id, body.message);
  }

  @Get('notifications')
  async getNotifications(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAdminNotifications(req.user.id);
  }

  // Only admin can reply (send notification) to user
  @Post('reply-user')
  async replyUser(@Req() req: any, @Body() body: { userId: string, message: string }) {
      this.checkAdmin(req);
      return this.adminService.notifyUser(body.userId, body.message, req.user.id);
  }

  @Post('notifications/read-all')
  async markAsRead(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.markNotificationsAsRead(req.user.id);
  }

  @Delete('notifications/:id')
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteNotification(req.user.id, id);
  }

  @Delete('notifications/clear/all')
  async clearAllMessages(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.clearAllMessages(req.user.id);
  }

  @Get('chat-history/:userId')
  async getChatHistory(@Req() req: any, @Param('userId') userId: string) {
    this.checkAdmin(req);
    return this.adminService.getChatHistory(userId);
  }

  private checkAdmin(req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Ushbu amal uchun huquqingiz yo\'q');
    }
  }
}
