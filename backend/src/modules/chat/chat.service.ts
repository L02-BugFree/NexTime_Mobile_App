import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../rooms/entities/message.schema';
import { Room, RoomType } from '../rooms/entities/room.schema';
import { Group } from '../group/entities/group.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    private jwtService: JwtService,
  ) {}

  async verifyToken(token: string): Promise<string | null> {
    try {
      const decoded = this.jwtService.verify(token);
      console.log('Decoded:', decoded); // Phải thấy { sub: '...', email: '...' }
      return decoded.userId || decoded.sub;
    } catch (error) {
      console.error('JWT Error:', error.message); // 'invalid signature' = secret sai
      return null;
    }
  }

  async isRoomMember(userId: string, roomId: string): Promise<boolean> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) return false;

    const uid = userId.toString();

    if (room.type === RoomType.DIRECT || room.type === RoomType.SELF) {
      return (
        room.ownerId?.toString() === uid ||
        room.userA?.toString() === uid ||
        room.userB?.toString() === uid
      );
    }

    if (room.type === RoomType.GROUP && room.groupId) {
      const group = await this.groupModel.findById(room.groupId).exec();
      if (!group) return false;
      return group.members?.some((m: any) => m?.toString() === uid) ?? false;
    }

    return false;
  }

  async saveMessage(userId: string, roomId: string, content: string): Promise<Message> {
    // Verify user is member
    const isMember = await this.isRoomMember(userId, roomId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this room');
    }

    const message = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(userId),
      content,
    });

    await message.save();

    // Update room's updatedAt
    await this.roomModel.findByIdAndUpdate(roomId, { updatedAt: new Date() });

    return message;
  }
}