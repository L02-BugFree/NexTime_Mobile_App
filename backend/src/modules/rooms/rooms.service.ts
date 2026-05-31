import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomType } from './entities/room.schema';
import { Group } from '../group/entities/group.schema';
import { User } from '../user/entities/user.schema';
import { HeatmapService } from '../heatmap/heatmap.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { Message } from './entities/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

// rooms.service.ts - Updated with privacy
@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    private heatmapService: HeatmapService,
  ) {}

  // ✅ Create a room
  async createRoom(userId: string, dto: CreateRoomDto): Promise<Room> {
    if (dto.type === RoomType.GROUP) {
      if (!dto.groupId)
        throw new BadRequestException('groupId is required for GROUP rooms');
      const group = await this.groupModel.findById(dto.groupId).lean().exec();
      if (!group) throw new NotFoundException('Group not found');

      const isGroupMember = (group.members ?? []).some(
        (memberId) => memberId.toString() === userId,
      );
      if (!isGroupMember) {
        throw new ForbiddenException(
          'You must be a member of the group to create a GROUP room',
        );
      }
    }

    if (dto.type === RoomType.DIRECT) {
      if (!dto.userA || !dto.userB) {
        throw new BadRequestException(
          'DIRECT room requires both userA and userB',
        );
      }
      if (dto.userA === dto.userB) {
        throw new BadRequestException('userA and userB must be different');
      }
      if (dto.userA !== userId && dto.userB !== userId) {
        throw new BadRequestException(
          'DIRECT room must include requester as one participant',
        );
      }

      // Check if DIRECT room already exists
      const existingRoom = await this.roomModel
        .findOne({
          type: RoomType.DIRECT,
          $or: [
            {
              userA: new Types.ObjectId(dto.userA),
              userB: new Types.ObjectId(dto.userB),
            },
            {
              userA: new Types.ObjectId(dto.userB),
              userB: new Types.ObjectId(dto.userA),
            },
          ],
        })
        .exec();

      if (existingRoom) {
        return existingRoom;
      }

      const [userA, userB] = await Promise.all([
        this.userModel.findById(dto.userA).select('_id').lean().exec(),
        this.userModel.findById(dto.userB).select('_id').lean().exec(),
      ]);

      if (!userA || !userB) {
        throw new NotFoundException('Both direct participants must exist');
      }
    }

    if (dto.type === RoomType.SELF) {
      // Check if SELF room already exists
      const existingRoom = await this.roomModel
        .findOne({
          type: RoomType.SELF,
          ownerId: new Types.ObjectId(userId),
        })
        .exec();

      if (existingRoom) {
        return existingRoom;
      }
    }

    const payload: Partial<Room> = {
      type: dto.type,
      ownerId: new Types.ObjectId(userId),
      userA: dto.userA ? new Types.ObjectId(dto.userA) : undefined,
      userB: dto.userB ? new Types.ObjectId(dto.userB) : undefined,
      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
    };

    const created = new this.roomModel(payload);
    return created.save();
  }

  // ✅ List all rooms for a user
  async listRoomsForUser(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);
    const groups = await this.groupModel
      .find({ members: userObjectId })
      .select('_id')
      .lean()
      .exec();
    const groupIds = groups.map((group) => group._id);

    const rooms = await this.roomModel
      .find({
        $or: [
          { ownerId: userObjectId },
          { userA: userObjectId },
          { userB: userObjectId },
          ...(groupIds.length > 0 ? [{ groupId: { $in: groupIds } }] : []),
        ],
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const result = await Promise.all(
      rooms.map(async (room: any) => {
        let name = 'Cuộc trò chuyện';
        let avatarUrl: string | null = null;  // ✅ Khai báo rõ kiểu

        if (room.type === RoomType.DIRECT) {
          const otherUserId = room.userA?.toString() === userId ? room.userB : room.userA;
          if (otherUserId) {
            const otherUser = await this.userModel
              .findById(otherUserId)
              .select('displayName email avatarUrl')
              .lean()
              .exec();
            if (otherUser?.displayName) name = otherUser.displayName;
            if (otherUser?.avatarUrl) avatarUrl = otherUser.avatarUrl;
          }
        } else if (room.type === RoomType.GROUP && room.groupId) {
          const group = await this.groupModel
            .findById(room.groupId)
            .select('name')
            .lean()
            .exec();
          if (group?.name) name = group.name;
        } else if (room.type === RoomType.SELF) {
          name = 'Ghi chú cá nhân';
        }

        // Get last message
        const lastMessage = await this.messageModel
          .findOne({ roomId: room._id })
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        return {
          ...room,
          id: room._id.toString(),
          name,
          avatarUrl,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: (lastMessage as any)?.createdAt || null,
        };
      }),
    );

    return result;
  }

  // ✅ Get messages with pagination
  async getMessages(
    userId: string,
    roomId: string,
    query: MessagesQueryDto,
  ): Promise<{ items: Message[]; page: number; limit: number; total: number }> {
    await this.assertRoomMember(userId, roomId);

    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.messageModel
        .find({ roomId: new Types.ObjectId(roomId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'displayName email avatarUrl')
        .lean()
        .exec(),
      this.messageModel.countDocuments({ roomId: new Types.ObjectId(roomId) }),
    ]);

    return { items: items.reverse(), page, limit, total };
  }

  // ✅ Send a message
  async sendMessage(
    userId: string,
    roomId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    await this.assertRoomMember(userId, roomId);

    const created = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(userId),
      content: dto.content,
    });
    const message = await created.save();

    // Update room's updatedAt
    await this.roomModel
      .findByIdAndUpdate(roomId, { $set: { updatedAt: new Date() } })
      .exec();

    return message.populate('senderId', 'displayName email avatarUrl');
  }

  // ✅ Get heatmap for room
  async getHeatmap(userId: string, roomId: string, month?: string) {
    const room = await this.assertRoomMember(userId, roomId);
    const memberIds = await this.getRoomMemberIds(room);

    // Privacy check for DIRECT rooms
    const privacyCheck = async (targetUserId: string): Promise<boolean> => {
      if (room.type !== RoomType.DIRECT) return true;

      if (targetUserId === userId) return true;

      const targetUser = await this.userModel
        .findById(targetUserId)
        .lean()
        .exec();
      if (!targetUser) return false;

      if (targetUser.privacySettings?.anonymousOnGroupCalendar) {
        return false;
      }

      return true;
    };

    // ✅ Gọi service và nhận kết quả
    const result = await this.heatmapService.generateHeatmap(
      memberIds,
      month,
      privacyCheck,
    );

    // ✅ Destructure sau khi đã có kết quả
    const { busySlots, totalMembers } = result;

    return {
      roomId: room._id,
      month: month ?? new Date().toISOString().slice(0, 7),
      totalMembers,
      busySlots,
    };
  }

  // ✅ Get room by ID
  async getRoom(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  // ✅ Delete room (only owner)
  async deleteRoom(
    userId: string,
    roomId: string,
  ): Promise<{ message: string }> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    if (room.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only room owner can delete the room');
    }

    // Delete all messages in the room
    await this.messageModel.deleteMany({ roomId: new Types.ObjectId(roomId) });
    await this.roomModel.findByIdAndDelete(roomId);

    return { message: 'Room deleted successfully' };
  }

  // ========== PRIVATE METHODS ==========

  private async assertRoomMember(
    userId: string,
    roomId: string,
  ): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    const isMember = await this.isUserInRoom(userId, room);
    if (!isMember) throw new ForbiddenException('No access to room');

    return room;
  }

  private async isUserInRoom(userId: string, room: Room): Promise<boolean> {
    const participantIds = await this.getRoomMemberIds(room);
    return participantIds.includes(userId);
  }

  private async getRoomMemberIds(room: Room): Promise<string[]> {
    if (room.type === RoomType.SELF) {
      return [room.ownerId.toString()];
    }

    if (room.type === RoomType.DIRECT) {
      const userA = room.userA?.toString();
      const userB = room.userB?.toString();
      if (!userA || !userB)
        throw new BadRequestException('DIRECT room is missing participants');
      return [room.ownerId.toString(), userA, userB].filter(
        (id, index, arr) => arr.indexOf(id) === index,
      );
    }

    if (room.type === RoomType.GROUP) {
      if (!room.groupId)
        throw new BadRequestException('GROUP room must have groupId');
      const group = await this.groupModel.findById(room.groupId).lean().exec();
      if (!group) throw new NotFoundException('Group not found for room');

      const members = (group.members ?? []).map((memberId) =>
        memberId.toString(),
      );
      return [room.ownerId.toString(), ...members].filter(
        (id, index, arr) => arr.indexOf(id) === index,
      );
    }

    return [];
  }
}
