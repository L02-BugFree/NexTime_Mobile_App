import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { Room, RoomType } from './entities/room.schema';
import { Message } from './entities/message.schema';


@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto): Promise<Room> {
    // basic ownership: ownerId = userId
    if (dto.type === RoomType.GROUP && !dto.groupId) {
      throw new BadRequestException('groupId is required for GROUP rooms');
    }

    const payload: Partial<Room> = {
      type: dto.type,
      ownerId: userId as any,
      userA: dto.userA as any,
      userB: dto.userB as any,
      groupId: dto.groupId as any,
    };

    const created = new this.roomModel(payload);
    return created.save();
  }

  async listRoomsForUser(userId: string): Promise<Room[]> {
    return this.roomModel.find({ ownerId: userId }).exec();
  }

  private async assertRoomOwner(userId: string, roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId.toString() !== userId) throw new ForbiddenException('No access to room');
    return room;
  }

  async getMessages(userId: string, roomId: string, query: MessagesQueryDto): Promise<{ items: Message[]; page: number; limit: number }> {
    await this.assertRoomOwner(userId, roomId);

    const limit = query.limit ?? 50;
    const page = query.page ?? 1;

    const items = await this.messageModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { items, page, limit };
  }

  async sendMessage(userId: string, roomId: string, dto: CreateMessageDto): Promise<Message> {
    await this.assertRoomOwner(userId, roomId);

    const created = new this.messageModel({ roomId, senderId: userId, content: dto.content });
    return created.save();
  }

  // --------------------
  // Heatmap (Sub-phase 1.5)
  // --------------------
  async getHeatmap(userId: string, roomId: string, month?: string): Promise<any> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    // Access rules: require ownership to keep it consistent with the rest of this repo.
    // If you later want participant-based access, we can extend this.
    if (room.ownerId.toString() !== userId) {
      throw new ForbiddenException('No access to room');
    }

    // Determine month string
    const monthStr = month ?? new Date().toISOString().slice(0, 7); // YYYY-MM

    // Resolve members
    const memberIds: string[] = [];
    if (room.type === RoomType.SELF) {
      memberIds.push(room.ownerId.toString());
    } else if (room.type === RoomType.DIRECT) {
      const a = room.userA?.toString();
      const b = room.userB?.toString();
      if (!a || !b) throw new BadRequestException('DIRECT room must have userA and userB');
      memberIds.push(a, b);

      // Privacy constraint: if the other user has anonymousOnGroupCalendar: true => forbidden
      // Need the other user relative to requester.
      const otherId = room.ownerId.toString() === a ? b : a;
      // Fetch other user's privacy settings.
      // Room service only needs a boolean flag; keep this as a direct user-lookup.
      const otherUser = await this.roomModel.db.collection('users').findOne({
        _id: new (this.roomModel.db as any).constructor.Types.ObjectId(otherId),
      });


      if (otherUser?.privacySettings?.anonymousOnGroupCalendar) {
        throw new ForbiddenException('Cannot view heatmap due to privacy settings');
      }




    } else if (room.type === RoomType.GROUP) {
      // For GROUP rooms, we keep GROUP-level heatmap privacy ignored (requirement).
      const groupDoc = await this.roomModel.db.collection('groups').findOne({ _id: (room as any).groupId });
      if (!groupDoc) throw new NotFoundException('Group not found for room');
      const members = (groupDoc.members || []) as string[];
      memberIds.push(...members.map((m) => m.toString()));
    }

    // Fetch calendars for all members
    const monthRegex = `^${monthStr}`;
    const calendars = await this.roomModel.db.collection('monthlycalendars').find({
      userId: { $in: memberIds.map((id) => id) },
      month: { $regex: monthRegex },
    }).toArray();


    // Aggregate busy counts from eventsInMonth to 30-min slots.
    // Current schedule service returns already-formed Heatmap response DTO; here we implement a simple one.
    const slots = new Map<string, { startTime: string; endTime: string; busyCount: number }>();

    for (const cal of calendars) {
      const eventsInMonth = cal.eventsInMonth || [];
      for (const ev of eventsInMonth) {
        const start = ev.startTime;
        const end = ev.endTime;
        if (!start || !end) continue;

        // Step 30 minutes between start and end (ISO times). We treat ev.startTime/endTime as HH:MM.
        const startDate = new Date(`1970-01-01T${start}:00Z`);
        const endDate = new Date(`1970-01-01T${end}:00Z`);
        let cur = new Date(startDate);
        while (cur < endDate) {
          const next = new Date(cur.getTime() + 30 * 60 * 1000);
          const key = `${cur.toISOString().slice(11, 16)}-${next.toISOString().slice(11, 16)}`;
          const slotStart = cur.toISOString().slice(11, 16);
          const slotEnd = next.toISOString().slice(11, 16);
          const existing = slots.get(key);
          if (existing) {
            existing.busyCount += 1;
          } else {
            slots.set(key, { startTime: slotStart, endTime: slotEnd, busyCount: 1 });
          }
          cur = next;
        }
      }
    }

    return {
      roomId: room._id,
      month: monthStr,
      timeSlots: Array.from(slots.values()).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  }
}


