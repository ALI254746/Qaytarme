
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as webpush from 'web-push';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../schemas/message.schema';
import { User } from '../../schemas/user.schema';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private chatGateway: ChatGateway,
  ) {
    // VAPID keys setup
    // VAPID keys setup
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@qaytarme.uz',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
      console.warn('VAPID keys not found. Push notifications will be disabled.');
    }
  }

  async sendMessage(senderId: string, recipientId: string, content: string, itemId?: string) {
    try {
      const newMessage = new this.messageModel({
        sender: new Types.ObjectId(senderId),
        recipient: new Types.ObjectId(recipientId),
        content,
        item: itemId ? new Types.ObjectId(itemId) : null,
      });
      const savedMessage = await newMessage.save();
      
      const sender = await this.userModel.findById(senderId, 'name');
      const recipient = await this.userModel.findById(recipientId, 'pushSubscription');

      // Emit via socket
      const populatedMessage = await this.messageModel.findById(savedMessage._id)
        .populate('sender', 'name avatar')
        .populate({
          path: 'item',
          populate: { path: 'user', select: 'name avatar' }
        })
        .exec();
        
      this.chatGateway.emitMessage(recipientId, populatedMessage);

      // Send Push Notification
      if (recipient?.pushSubscription) {
        try {
          const payload = JSON.stringify({
            title: sender?.name || 'Yangi xabar',
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            url: '/mainpage/messages'
          });
          await webpush.sendNotification(recipient.pushSubscription, payload);
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
        }
      }
      
      return savedMessage;
    } catch (error) {
      console.error('Socket emit error or save error:', error);
      throw new InternalServerErrorException('Error sending message');
    }
  }

  async getConversations(userId: string) {
    try {
      const currentUserId = new Types.ObjectId(userId);

      return await this.messageModel.aggregate([
        {
          $match: {
            $or: [{ sender: currentUserId }, { recipient: currentUserId }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', currentUserId] },
                '$recipient',
                '$sender',
              ],
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', currentUserId] },
                      { $eq: ['$read', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: '$userInfo',
        },
        {
          $project: {
            _id: 1,
            lastMessage: 1,
            unreadCount: 1,
            user: {
              _id: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email',
              avatar: '$userInfo.avatar',
              role: '$userInfo.role',
            },
          },
        },
        {
          $sort: { 'lastMessage.createdAt': -1 },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException('Error fetching conversations');
    }
  }

  async getChatHistory(userId1: string, userId2: string) {
    const id1 = new Types.ObjectId(userId1);
    const id2 = new Types.ObjectId(userId2);

    // Mark as read
    await this.messageModel.updateMany(
      { sender: id2, recipient: id1, read: false },
      { $set: { read: true } },
    );

    return this.messageModel.find({
      $or: [
        { sender: id1, recipient: id2 },
        { sender: id2, recipient: id1 },
      ],
    })
    .populate('sender', 'name avatar')
    .populate({
      path: 'item',
      populate: { path: 'user', select: 'name avatar' }
    })
    .sort({ createdAt: 1 })
    .exec();
  }

  async getTotalUnreadCount(userId: string) {
    return this.messageModel.countDocuments({
      recipient: new Types.ObjectId(userId),
      read: false,
    });
  }
}
