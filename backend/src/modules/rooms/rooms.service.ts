import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { Room, RoomType } from './entities/room.schema';
import { Message } from './entities/message.schema';
import { Group } from '../group/entities/group.schema';
import { User } from '../user/entities/user.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';

type HeatmapSlot = {
  date: string;
  startTime: string;
  endTime: string;
  busyCount: number;
};

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MonthlyCalendar.name)
    private monthlyCalendarModel: Model<MonthlyCalendar>,
  ) {}

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

      const [userA, userB] = await Promise.all([
        this.userModel.findById(dto.userA).select('_id').lean().exec(),
        this.userModel.findById(dto.userB).select('_id').lean().exec(),
      ]);

      if (!userA || !userB) {
        throw new NotFoundException('Both direct participants must exist');
      }
    }

    if (dto.type === RoomType.SELF) {
      if (dto.userA || dto.userB || dto.groupId) {
        throw new BadRequestException(
          'SELF room does not accept userA/userB/groupId',
        );
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

  async listRoomsForUser(userId: string): Promise<Room[]> {
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
        if (room.type === RoomType.DIRECT) {
          const otherUserId = room.userA?.toString() === userId ? room.userB : room.userA;
          if (otherUserId) {
            const otherUser = await this.userModel.findById(otherUserId).select('displayName').lean().exec();
            if (otherUser?.displayName) name = otherUser.displayName;
          }
        } else if (room.type === RoomType.GROUP && room.groupId) {
          const group = await this.groupModel.findById(room.groupId).select('name').lean().exec();
          if (group?.name) name = group.name;
        } else if (room.type === RoomType.SELF) {
          name = 'Ghi chú cá nhân';
        }

        return {
          ...room,
          id: room._id.toString(),
          name,
        };
      })
    );

    return result as any;
  }

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

  async getMessages(
    userId: string,
    roomId: string,
    query: MessagesQueryDto,
  ): Promise<{ items: Message[]; page: number; limit: number }> {
    await this.assertRoomMember(userId, roomId);

    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const skip =
      typeof query.skip === 'number' ? query.skip : (page - 1) * limit;

    const items = await this.messageModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

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

    await this.roomModel
      .findByIdAndUpdate(roomId, { $set: { updatedAt: new Date() } })
      .exec();

    return message;
  }

  async getHeatmap(
    userId: string,
    roomId: string,
    month?: string,
  ): Promise<any> {
    const room = await this.assertRoomMember(userId, roomId);

    const monthStr = this.validateMonth(month);
    const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);
    const monthEnd = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );

    const memberIds = await this.getRoomMemberIds(room);

    if (room.type === RoomType.DIRECT) {
      const otherUserId = memberIds.find((id) => id !== userId);
      if (otherUserId) {
        const otherUser = await this.userModel
          .findById(otherUserId)
          .select('privacySettings.anonymousOnGroupCalendar')
          .lean()
          .exec();
        if (otherUser?.privacySettings?.anonymousOnGroupCalendar) {
          throw new ForbiddenException(
            'Cannot view heatmap due to privacy settings',
          );
        }
      }
    }

    const memberIdSet = new Set(memberIds);
    const calendars = (
      await this.monthlyCalendarModel.find({ month: monthStr }).lean().exec()
    ).filter((calendar) => memberIdSet.has(calendar.userId.toString()));

    const slotMap = this.createMonthSlotMap(monthStart, monthEnd);

    for (const calendar of calendars) {
      for (const event of calendar.eventsInMonth ?? []) {
        const baseDate = new Date(event.fullDate);
        if (Number.isNaN(baseDate.getTime())) continue;

        const start = this.combineDateAndTimeUtc(baseDate, event.startTime);
        const end = this.combineDateAndTimeUtc(baseDate, event.endTime);
        if (!start || !end || start >= end) continue;

        for (
          let cursor = new Date(start);
          cursor < end;
          cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
        ) {
          const slot = slotMap.get(cursor.toISOString());
          if (slot) slot.busyCount += 1;
        }
      }
    }

    return {
      roomId: room._id,
      month: monthStr,
      timeSlots: Array.from(slotMap.values()),
    };
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

  private combineDateAndTimeUtc(
    baseDate: Date,
    time: string | undefined,
  ): Date | null {
    if (!time) return null;

    const [hourStr, minuteStr] = time.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;

    return new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
        hour,
        minute,
        0,
        0,
      ),
    );
  }

  private createMonthSlotMap(
    monthStart: Date,
    monthEnd: Date,
  ): Map<string, HeatmapSlot> {
    const slots = new Map<string, HeatmapSlot>();

    for (
      let cursor = new Date(monthStart);
      cursor < monthEnd;
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
    ) {
      const end = new Date(cursor.getTime() + 30 * 60 * 1000);
      slots.set(cursor.toISOString(), {
        date: cursor.toISOString().slice(0, 10),
        startTime: cursor.toISOString().slice(11, 16),
        endTime: end.toISOString().slice(11, 16),
        busyCount: 0,
      });
    }

    return slots;
  }

  private validateMonth(month?: string): string {
    const monthString = month ?? new Date().toISOString().slice(0, 7);
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(monthString)) {
      throw new BadRequestException('month must be in format YYYY-MM');
    }
    return monthString;
  }
}
