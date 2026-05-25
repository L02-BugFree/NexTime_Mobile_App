import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from './entities/group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';

type HeatmapSlot = {
  date: string;
  startTime: string;
  endTime: string;
  busyCount: number;
};

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(MonthlyCalendar.name)
    private monthlyCalendarModel: Model<MonthlyCalendar>,
  ) {}

  async create(userId: string, createGroupDto: CreateGroupDto) {
    const memberIds = new Set<string>([
      ...(createGroupDto.members ?? []),
      userId,
    ]);
    const createdGroup = new this.groupModel({
      ...createGroupDto,
      members: Array.from(memberIds).map((id) => new Types.ObjectId(id)),
    });
    return createdGroup.save();
  }

  async findAll(userId: string) {
    return this.groupModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('members', '_id displayName email avatarUrl')
      .exec();
  }

  async getHeatmap(userId: string, groupId: string, month?: string) {
    const group = await this.groupModel.findById(groupId).lean().exec();
    if (!group) throw new NotFoundException('Group not found');

    const isMember = (group.members ?? []).some(
      (memberId) => memberId.toString() === userId,
    );
    if (!isMember)
      throw new ForbiddenException('You are not a member of this group');

    const monthStr = this.validateMonth(month);
    const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);
    const monthEnd = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );

    const memberIds = new Set(
      (group.members ?? []).map((memberId) => memberId.toString()),
    );
    const calendars = (
      await this.monthlyCalendarModel.find({ month: monthStr }).lean().exec()
    ).filter((calendar) => memberIds.has(calendar.userId.toString()));

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
          const slotKey = cursor.toISOString();
          const slot = slotMap.get(slotKey);
          if (slot) slot.busyCount += 1;
        }
      }
    }

    return {
      groupId,
      month: monthStr,
      timeSlots: Array.from(slotMap.values()),
    };
  }

  async removeMemberFromAllGroups(userId: string) {
    await this.groupModel.updateMany(
      { members: new Types.ObjectId(userId) },
      { $pull: { members: new Types.ObjectId(userId) } },
    );
  }

  private validateMonth(month?: string): string {
    const monthString = month ?? new Date().toISOString().slice(0, 7);
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(monthString)) {
      throw new BadRequestException('month must be in format YYYY-MM');
    }
    return monthString;
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
}
