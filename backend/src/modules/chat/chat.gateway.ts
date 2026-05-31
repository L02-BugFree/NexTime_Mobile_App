import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store user's socket ids to their rooms
  private userSockets: Map<string, string[]> = new Map();
  private roomUsers: Map<string, Set<string>> = new Map();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      // Get user from token (you need to implement token extraction)
      const token = client.handshake.auth.token;
      console.log('Token received:', token ? 'exists' : 'MISSING');
      const userId = await this.chatService.verifyToken(token);
      console.log('Verified userId:', userId);

      if (userId) {
        client.user = { userId };

        // Store socket
        const userSockets = this.userSockets.get(userId) || [];
        userSockets.push(client.id);
        this.userSockets.set(userId, userSockets);

        console.log(`✅ User ${userId} connected with socket ${client.id}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.user) {
      const userId = client.user.userId;
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) sockets.splice(index, 1);
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, sockets);
      }

      console.log(`❌ User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.user) return;

    const { roomId } = data;
    const userId = client.user.userId;

    // Verify user is member of room
    const isMember = await this.chatService.isRoomMember(userId, roomId);
    if (!isMember) {
      client.emit('error', { message: 'Not authorized to join this room' });
      return;
    }

    // Join socket.io room
    client.join(`room:${roomId}`);

    // Track room users
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    
    // Lưu kết quả get vào biến và kiểm tra
    const roomUserSet = this.roomUsers.get(roomId);
    if (roomUserSet) {
      roomUserSet.add(userId);
      console.log(`User ${userId} joined room ${roomId}`);

      // Notify others in room
      client.to(`room:${roomId}`).emit('user-joined', {
        userId,
        onlineCount: roomUserSet.size,
      });

      // Send current online users
      client.emit('room-info', {
        roomId,
        onlineCount: roomUserSet.size,
      });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.user) return;

    const { roomId } = data;
    const userId = client.user.userId;

    client.leave(`room:${roomId}`);

    // Lưu kết quả get vào biến và kiểm tra
    const roomUserSet = this.roomUsers.get(roomId);
    if (roomUserSet) {
      roomUserSet.delete(userId);
      
      if (roomUserSet.size === 0) {
        this.roomUsers.delete(roomId);
      } else {
        // Notify others
        client.to(`room:${roomId}`).emit('user-left', {
          userId,
          onlineCount: roomUserSet.size,
        });
      }
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    if (!client.user) return;

    const { roomId, content } = data;
    const userId = client.user.userId;

    try {
      // Save message to database
      const message = await this.chatService.saveMessage(
        userId,
        roomId,
        content,
      );

      // Broadcast to everyone in the room (including sender for consistency)
      this.server.to(`room:${roomId}`).emit('new-message', {
        ...message.toObject(),
        _id: message._id.toString(),
        roomId: message.roomId.toString(),
        senderId: message.senderId.toString(),
      });

      console.log(`📨 Message sent in room ${roomId} from user ${userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    if (!client.user) return;

    client.to(`room:${data.roomId}`).emit('user-typing', {
      userId: client.user.userId,
      isTyping: data.isTyping,
    });
  }
}