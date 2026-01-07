
import { 
  Controller, 
  Get, 
  Put, 
  Post,
  Patch,
  Param,
  UseGuards, 
  Req, 
  Body,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { User } from '../../schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Ariza.name) private arizaModel: Model<Ariza>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    
    // 1. Topganlarim (Found by me)
    const foundCount = await this.arizaModel.countDocuments({ 
      user: new Types.ObjectId(userId), 
      status: 'found' 
    });

    // 2. Yo'qotganlarim (Lost by me)
    const lostCount = await this.arizaModel.countDocuments({ 
      user: new Types.ObjectId(userId), 
      status: 'lost' 
    });

    // 3. Topib berishgan (Returned TO me)
    // a) User lost something (Owner, status='lost') and it was returned.
    // b) User claimed a found item (MatchedUser, status='found') and it was returned.
    const returnedToMeCount = await this.arizaModel.countDocuments({
      $or: [
        { user: new Types.ObjectId(userId), status: 'lost', moderationStatus: 'returned' },
        { matchedUser: new Types.ObjectId(userId), status: 'found', moderationStatus: 'returned' }
      ]
    });

    // 4. Topib berganman (Returned BY me)
    // a) User found something (status='found') and it's returned.
    // b) User matched someone else's lost item (status='lost', matchedUser=me) and it's returned.
    const returnedByMeCount = await this.arizaModel.countDocuments({
      $or: [
        { user: new Types.ObjectId(userId), status: 'found', moderationStatus: 'returned' },
        { matchedUser: new Types.ObjectId(userId), status: 'lost', moderationStatus: 'returned' }
      ]
    });

    // 5. Jarayonda (Active Deals)
    // Deals where user is involved (as owner or matched user), matchedUser exists, but NOT returned.
    const activeDealsCount = await this.arizaModel.countDocuments({
        $or: [
            { user: new Types.ObjectId(userId), matchedUser: { $exists: true, $ne: null }, moderationStatus: { $ne: 'returned' } },
            { matchedUser: new Types.ObjectId(userId), moderationStatus: { $ne: 'returned' } }
        ]
    });

    return {
      ...user.toObject(),
      stats: {
        // New Mobile Fields
        foundCount,
        lostCount,
        returnedToMeCount,
        returnedByMeCount,
        activeDealsCount,

        // Legacy Desktop Fields (Backward Compatibility)
        itemsFound: foundCount,
        itemsLost: lostCount,
        successfulReturns: returnedByMeCount,
        xadiya: 0,

        // Desktop My-Items Style Aliases (Requested by User)
        found: foundCount,
        lost: lostCount,
        returnedToMe: returnedToMeCount,
        returnedByMe: returnedByMeCount,
        inProcess: activeDealsCount
      }
    };
  }

  @Put('me')
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    const allowedFields = ['name', 'phone', 'bio'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedUser = await this.usersService.update(req.user.id, filteredData);
    
    if (!updatedUser) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return {
      message: 'Profil muvaffaqiyatli yangilandi',
      user: updatedUser
    };
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Rasm yuklanmadi');
    }

    try {
      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadFile(file);
      
      // Update user avatar
      const updatedUser = await this.usersService.update(req.user.id, {
        avatar: result.secure_url
      });

      return {
        message: 'Avatar muvaffaqiyatli yuklandi',
        avatar: result.secure_url,
        user: updatedUser
      };
    } catch (error) {
      throw new BadRequestException('Avatar yuklashda xatolik yuz berdi');
    }
  }

  @Get('notifications')
  async getNotifications(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return {
      notifications: user.notifications || [],
      unreadCount: (user.notifications || []).filter((n: any) => !n.read).length
    };
  }

  @Patch('notifications/:notificationId/read')
  async markNotificationRead(@Req() req: any, @Body() body: { notificationId: string }) {
    const user = await this.usersService.findById(req.user.id);
    
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    // Mark notification as read
    const notifications = user.notifications || [];
    const notification = notifications.find((n: any) => n._id.toString() === body.notificationId);
    
    if (notification) {
      notification.read = true;
      await this.usersService.update(req.user.id, { notifications });
    }

    return { message: 'Bildirishnoma o\'qilgan deb belgilandi' };
  }

  @Post('notifications/read-all')
  async markAllNotificationsRead(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const notifications = (user.notifications || []).map((n: any) => {
        const plainNotification = n.toObject ? n.toObject() : n;
        return { ...plainNotification, read: true };
    });

    await this.usersService.update(req.user.id, { notifications });

    return { message: 'Barcha bildirishnomalar o\'qilgan deb belgilandi' };
  }

  @Post('push-subscription')
  async savePushSubscription(@Req() req: any, @Body() subscription: any) {
    await this.usersService.update(req.user.id, {
      pushSubscription: subscription
    });
    return { message: 'Push obunasi saqlandi' };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    };
  }
}
