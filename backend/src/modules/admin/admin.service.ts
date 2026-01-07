
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { User } from '../../schemas/user.schema';
import { Message } from '../../schemas/message.schema';

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Ariza.name) private arizaModel: Model<Ariza>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private chatGateway: ChatGateway,
  ) {}





  async getStats() {
    const totalAriza = await this.arizaModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments();
    const foundItems = await this.arizaModel.countDocuments({ status: 'found' });
    const newMessages = await this.messageModel.countDocuments({ read: false });

    return {
      totalAriza: totalAriza.toLocaleString(),
      activeUsers: activeUsers.toLocaleString(),
      foundItems: foundItems.toLocaleString(),
      newMessages: newMessages.toLocaleString(),
    };
  }

  async getRecentActivity() {
    const recentItems = await this.arizaModel.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return recentItems.map(item => ({
      id: item._id,
      user: item.user?.['name'] || 'Noma\'lum',
      action: item.status === 'lost' ? 'yangi yo\'qolgan buyum' : 'yangi topilgan buyum',
      item: item.itemType,
      time: this.formatTime(item.createdAt),
      image: item.image?.url,
    }));
  }

  async deleteItem(id: string) {
    return this.arizaModel.findByIdAndDelete(id).exec();
  }

  async getAllItems() {
    return this.arizaModel.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateItemStatus(id: string, moderationStatus: string) {
    return this.arizaModel.findByIdAndUpdate(
      id,
      { moderationStatus },
      { new: true }
    ).exec();
  }

  async getAllUsers() {
    const users = await this.userModel.find().lean().exec();
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const itemCount = await this.arizaModel.countDocuments({ user: user._id });
      return {
        ...user,
        items: itemCount,
        joined: this.formatTime(user['createdAt'] || new Date()),
      };
    }));
    return usersWithStats;
  }

  async deleteUser(id: string) {
    // Delete user's arizas too? User's choice, usually yes.
    await this.arizaModel.deleteMany({ user: id });
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async getDetailedStats() {
    // 1. Category Breakdown
    const categoryStats = await this.arizaModel.aggregate([
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 2. Monthly Growth (last 8 months)
    const monthlyStats = await this.userModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 8 }
    ]);

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sent', 'Okt', 'Noy', 'Dek'];
    
    return {
      categories: categoryStats.map(c => ({
        name: c._id || 'Boshqa',
        count: c.count,
        growth: '+0%', // Placeholder for now
        color: Math.random() > 0.5 ? 'bg-mint' : 'bg-white'
      })),
      monthlyGrowth: monthlyStats.map(m => ({
        month: months[m._id.month - 1],
        count: m.count
      }))
    };
  }

  async getAdminNotifications(adminId: string) {
    const admin = await this.userModel.findById(adminId).select('notifications').exec();
    if (!admin) return [];
    
    // Reverse to show latest first
    const notifs = (admin.notifications || []).reverse();
    
    // Explicitly convert ObjectId to string to prevent serialization issues
    const cleanNotifs = notifs.map(n => {
        const doc = n.toObject ? n.toObject() : n;
        return {
            ...doc,
            _id: doc._id ? doc._id.toString() : null,
            from: doc.from ? doc.from.toString() : null
        };
    });

    return cleanNotifs;
  }

  private formatTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa avval`;
    if (hours < 24) return `${hours} soat avval`;
    return `${days} kun avval`;
  }



  async notifyAdmins(senderId: string, messageContent: string) {
    const sender = await this.userModel.findById(senderId);
    if (!sender) return;

    // 1. Save to Message Collection (Chat History) -> Assign to first found admin
    const rootAdmin = await this.userModel.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    let createdMessageId: any = null;

    if (rootAdmin) {
       const msg = await this.messageModel.create({
          sender: sender._id,
          recipient: rootAdmin._id,
          content: messageContent,
          read: false,
          createdAt: new Date()
       });
       createdMessageId = msg._id;
    }

    // 2. Push Notification to ALL admins
    await this.userModel.updateMany(
        { role: 'admin' },
        {
            $push: {
                notifications: {
                    type: 'admin_message',
                    message: `Admin xabari (${sender.name}): ${messageContent}`,
                    from: sender._id,
                    createdAt: new Date(),
                    read: false,
                    relatedMessageId: createdMessageId // Link the message
                }
            }
        }
    );
    
    // Return the ID of the specific admin we acted as "Chat Partner" with
    return { 
      success: true, 
      message: "Xabar adminga yuborildi", 
      adminId: rootAdmin ? rootAdmin._id : null 
    };
  }

  async notifyUser(userId: string, messageContent: string, senderId?: string) {
    let newMessage;
    // 1. Save to Message Collection
    if (senderId) {
       newMessage = await this.messageModel.create({
          sender: senderId,
          recipient: userId,
          content: messageContent,
          read: false,
          createdAt: new Date()
       });
    }

    // 2. Emit via socket (Real-time)
    if (senderId && newMessage) { 
      const populatedMessage = await this.messageModel.findById(newMessage._id)
          .populate('sender', 'name avatar role')
          .exec();
      
      this.chatGateway.emitMessage(userId, populatedMessage);
    }

    // 3. Push Notification
    await this.userModel.findByIdAndUpdate(userId, {
        $push: {
            notifications: {
                type: 'admin_message',
                message: `Admin: ${messageContent}`,
                from: senderId || null, 
                createdAt: new Date(),
                read: false
            }
        }
    });
    return { success: true, message: "Xabar foydalanuvchiga yuborildi" };
  }

  async getChatHistory(userId: string) {
     // Find all admins to get comprehensive history
     const admins = await this.userModel.find({ role: 'admin' }).select('_id');
     const adminIds = admins.map(a => a._id);

     const messages = await this.messageModel.find({
        $or: [
           { sender: userId, recipient: { $in: adminIds } }, // User -> Any Admin
           { sender: { $in: adminIds }, recipient: userId }  // Any Admin -> User
        ]
     })
     .sort({ createdAt: 1 })
     .populate('sender', 'name role') // Populate sender info
     .lean()
     .exec();

     return messages;
  }

  async markNotificationsAsRead(adminId: string) {
    const admin = await this.userModel.findById(adminId);
    if (!admin) return;

    if (admin.notifications && admin.notifications.length > 0) {
      admin.notifications.forEach(n => n.read = true);
      await admin.save();
    }
    return { success: true };
  }

  async deleteNotification(adminId: string, notificationId: string) {
    console.log(`Request to delete notification ${notificationId} for admin ${adminId}`);
    
    // Fetch the user
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
        console.log("Admin user not found");
        return { success: false, message: "Admin not found" };
    }

    if (!admin.notifications || admin.notifications.length === 0) {
        console.log("No notifications to delete");
        return { success: true };
    }

    const initialLength = admin.notifications.length;
    
    // 3. Find the notification to delete to check for linked message
    const notificationToDelete = admin.notifications.find(n => n._id.toString() === notificationId);
    
    // 4. Delete linked message if exists
    if (notificationToDelete?.relatedMessageId) {
        try {
            await this.messageModel.findByIdAndDelete(notificationToDelete.relatedMessageId);
            console.log("Deleted linked message:", notificationToDelete.relatedMessageId);
            
            // Emit socket event to sender (User) to remove message from their view
            if (notificationToDelete.from) {
                this.chatGateway.emitMessageDeleted(notificationToDelete.from.toString(), notificationToDelete.relatedMessageId.toString());
            }
        } catch (err) {
            console.error("Failed to delete linked message:", err);
        }
    }

    // 5. Filter out the notification manually
    admin.notifications = admin.notifications.filter(
        (n) => n._id && n._id.toString() !== notificationId
    );

    if (admin.notifications.length === initialLength) {
        console.log("Notification not found. ID requested:", notificationId);
        return { success: false, message: "Xabar topilmadi (ID mos kelmadi)" };
    }

    await admin.save();
    console.log("Notification deleted successfully. New count:", admin.notifications.length);
    return { success: true };
  }

  async clearAllMessages(adminId: string) {
    console.log(`[clearAllMessages] Starting for admin: ${adminId}`);
    try {
        // 1. Find admin and get notifications to extract IDs
        const admin = await this.userModel.findById(adminId);
        if (admin && admin.notifications) {
            const adminMessages = admin.notifications.filter(n => n.type === 'admin_message');
            console.log(`[clearAllMessages] Found ${adminMessages.length} admin messages.`);

            const linkedMessageIds = adminMessages
                .filter(n => n.relatedMessageId)
                .map(n => n.relatedMessageId);
            
            console.log(`[clearAllMessages] Found ${linkedMessageIds.length} linked messages to delete.`);

            if (linkedMessageIds.length > 0) {
                const deleteResult = await this.messageModel.deleteMany({ _id: { $in: linkedMessageIds } });
                console.log(`[clearAllMessages] Deleted ${deleteResult.deletedCount} linked messages from History.`);

                // Emit events for all deleted messages
                adminMessages.forEach(n => {
                    if (n.relatedMessageId && n.from) {
                        this.chatGateway.emitMessageDeleted(n.from.toString(), n.relatedMessageId.toString());
                    }
                });
            }
        }

        // 2. Clear notifications
        const result = await this.userModel.findByIdAndUpdate(adminId, {
            $pull: {
                notifications: { type: 'admin_message' }
            }
        }, { new: true });
        
        console.log("[clearAllMessages] Notifications cleared. Remaining count:", result?.notifications?.length);
        return { success: true, deletedCount: result ? result.notifications.length : 0 };
    } catch (error) {
        console.error("[clearAllMessages] Error:", error);
        throw error;
    }
  }
}
