
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      this.logger.log(`User connected: ${userId} (${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { recipientId: string; senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const recipientSocketId = this.userSockets.get(data.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('typing', { senderId: data.senderId });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { recipientId: string; senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const recipientSocketId = this.userSockets.get(data.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('stopTyping', { senderId: data.senderId });
    }
  }

  emitMessage(recipientId: string, message: any) {
    const recipientSocketId = this.userSockets.get(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('receiveMessage', message);
    }
  }

  emitMessageDeleted(recipientId: string, messageId: string) {
    const recipientSocketId = this.userSockets.get(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('messageDeleted', { messageId });
    }
  }
}
