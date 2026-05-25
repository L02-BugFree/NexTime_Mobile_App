import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './entities/event.schema';

import { MonthlyCalendar } from './entities/monthly-calendar.schema';
import { CreateOneshotDto } from './dto/create-oneshot.dto';


@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(MonthlyCalendar.name)
    private monthlyCalendarModel: Model<MonthlyCalendar>,
  ) {}

  async createWeekly(createWeeklyDto: any, userId: string, groupId?: string) {
    const data = { ...createWeeklyDto, type: 'weekly', userId, groupId };
    const event = await this.eventModel.create(data);
    const eventId = event._id;

    await this.populateWeeklyOccurrences(
      userId,
      createWeeklyDto,
      eventId,
      groupId,
    );

    return event;
  }

  async createOneshot(userId: string, dto: CreateOneshotDto): Promise<any> {
    const startTime = new Date(`${dto.date}T${dto.startTime}:00`);
    const endTime = new Date(`${dto.date}T${dto.endTime}:00`);
    const data = {
      title: dto.title,
      description: dto.description,
      date: dto.date,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      colorHex: dto.colorHex,
      tag: dto.tag,
      type: 'oneshot',
      userId,
    };
    const event = await this.eventModel.create(data);
    // Add to MonthlyCalendar
    const monthStr = dto.date.slice(0, 7);
    await this.monthlyCalendarModel.findOneAndUpdate(
      { userId, month: monthStr },
      {
        $push: {
          eventsInMonth: {
            originalEventId: event._id,
            title: dto.title,
            description: dto.description,
            fullDate: startTime,
            dayOfWeek: startTime.getDay() || 7,
            startTime: dto.startTime,
            endTime: dto.endTime,
            colorHex: dto.colorHex,
            type: 'oneshot',
          },
        },
      },
      { upsert: true },
    );
    return event;
  }

  private async populateWeeklyOccurrences(
    userId: string,
    dto: any,
    eventId: Types.ObjectId,
    groupId?: string,
  ) {
    console.log('--- Start Populating ---');
    console.log('User:', userId, 'DayOfWeek:', dto.dayOfWeek);

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 7);
    const months = [currentMonth, nextMonth];

    for (const monthStr of months) {
      console.log('Processing month:', monthStr);

      const year = parseInt(monthStr.slice(0, 4));
      const month = parseInt(monthStr.slice(5, 7)) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Remove existing slots for this event (separate ops avoid conflict)
      await this.monthlyCalendarModel.updateMany(
        { userId, month: monthStr, 'eventsInMonth.originalEventId': eventId },
        { $pull: { eventsInMonth: { originalEventId: eventId } } },
      );

      // Push new slots one by one
      for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = new Date(year, month, day, 12, 0, 0);
        const jsDayOfWeek = fullDate.getDay();
        const userDayOfWeek = dto.dayOfWeek === 7 ? 0 : dto.dayOfWeek;

        if (jsDayOfWeek === userDayOfWeek) {
          console.log(
            'Pushed slot for date:',
            fullDate.toISOString().slice(0, 10),
          );

          await this.monthlyCalendarModel.findOneAndUpdate(
            { userId, month: monthStr },
            {
              $push: {
                eventsInMonth: {
                  originalEventId: eventId,
                  title: dto.title,
                  description: dto.description,
                  fullDate,
                  dayOfWeek: dto.dayOfWeek,
                  startTime: dto.startTime,
                  endTime: dto.endTime,
                  colorHex: dto.colorHex,
                  type: 'weekly',
                },
              },
            },
            { upsert: true, returnDocument: 'after' },
          );
        }
      }

      console.log(`Processed ${daysInMonth} days for ${monthStr}`);
    }
  }

  private async populateOneShotOccurrence(
    userId: string,
    eventData: any,
    eventId: Types.ObjectId,
    groupId?: string,
  ) {
    const monthStr = eventData.fullDate.toISOString().slice(0, 7);

    const calendar = await this.monthlyCalendarModel.findOne({
      userId,
      month: monthStr,
    });
    const eventsInMonth = calendar ? calendar.eventsInMonth : [];

    eventsInMonth.push({
      originalEventId: eventId,
      title: eventData.title,
      description: eventData.description,
      fullDate: eventData.fullDate,
      dayOfWeek: eventData.dayOfWeek,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      colorHex: eventData.colorHex,
      type: eventData.type,
    });

    if (calendar) {
      calendar.eventsInMonth = eventsInMonth;
      await calendar.save();
    } else {
      await this.monthlyCalendarModel.create({
        userId,
        month: monthStr,
        eventsInMonth,
      });
    }
  }

  async getMonthly(userId: string, month?: string): Promise<any[]> {
    if (!month) {
      const now = new Date();
      month = now.toISOString().slice(0, 7);
    }
    const calendar = await this.monthlyCalendarModel.findOne({ userId, month });
    return calendar ? calendar.eventsInMonth : [];
  }

  private slotsOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  private generateSlots(start: Date, end: Date) {
    const slots: any[] = [];
    const current = new Date(start);
    while (current < end) {
      const endSlot = new Date(current.getTime() + 30 * 60 * 1000);
      slots.push({
        busyCount: 0,
        avatars: [],
        startTime: current.toISOString(),
        endTime: endSlot.toISOString(),
        isConflict: false,
      });
      current.setTime(endSlot.getTime());
    }
    return slots;
  }

  async findAll(groupId?: string) {
    return this.eventModel.find(groupId ? { groupId } : {}).exec();
  }

  async findOne(id: string) {
    return this.eventModel.findById(id).exec();
  }

  async update(userId: string, eventId: string, dto: any): Promise<Event | null> {
    const eventIdObj = new Types.ObjectId(eventId);
    const userIdObj = new Types.ObjectId(userId);

    // Clean, foundational execution state:
    // 1) Update core Event in one step and return the updated document.
    const updatedEvent = await this.eventModel
      .findOneAndUpdate(
        { _id: eventIdObj, userId: userIdObj } as any,
        {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
          ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
          ...(dto.colorHex !== undefined ? { colorHex: dto.colorHex } : {}),
          ...(dto.tag !== undefined ? { tag: dto.tag } : {}),
          ...(dto.date !== undefined ? { date: dto.date } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
        },
        { new: true },
      )
      .exec();

    if (!updatedEvent) throw new NotFoundException('Event not found');

    // 2) Synchronize MonthlyCalendar occurrences (purge -> rebuild)
    await this.monthlyCalendarModel.updateMany(
      { userId: userIdObj, 'eventsInMonth.originalEventId': eventIdObj },
      { $pull: { eventsInMonth: { originalEventId: eventIdObj } } },
    );

    // Step B: reconstruction based on updatedEvent.type
    if (updatedEvent.type === 'oneshot') {
      const oneshotDate: string | undefined = (updatedEvent as any).date;
      if (!oneshotDate) return updatedEvent;

      const monthStr = oneshotDate.slice(0, 7);

      // For oneshot, fullDate should be derived from the updated date.
      const fullDate = new Date(oneshotDate + 'T12:00:00.000Z');

      // MonthlyCalendar stores times as "HH:mm" strings (see createOneshot).
      const startTimeHHmm =
        typeof updatedEvent.startTime === 'string'
          ? updatedEvent.startTime.includes('T')
            ? updatedEvent.startTime.split('T')[1]?.slice(0, 5)
            : updatedEvent.startTime
          : (updatedEvent.startTime as any);

      const endTimeHHmm =
        typeof updatedEvent.endTime === 'string'
          ? updatedEvent.endTime.includes('T')
            ? updatedEvent.endTime.split('T')[1]?.slice(0, 5)
            : updatedEvent.endTime
          : (updatedEvent.endTime as any);

      await this.monthlyCalendarModel.findOneAndUpdate(
        { userId: userIdObj, month: monthStr },
        {
          $push: {
            eventsInMonth: {
              originalEventId: eventIdObj,
              title: updatedEvent.title,
              description: updatedEvent.description,
              fullDate,
              dayOfWeek: fullDate.getUTCDay() || 7,
              startTime: startTimeHHmm,
              endTime: endTimeHHmm,
              colorHex: updatedEvent.colorHex,
              type: 'oneshot',
            },
          },
        },
        { upsert: true },
      );

      return updatedEvent;
    }

    if (updatedEvent.type === 'weekly') {
      // populateWeeklyOccurrences handles purge/push across months.
      await this.populateWeeklyOccurrences(
        userIdObj.toString(),
        {
          title: updatedEvent.title,
          description: updatedEvent.description,
          dayOfWeek: (updatedEvent as any).dayOfWeek,
          startTime: (updatedEvent as any).startTime,
          endTime: (updatedEvent as any).endTime,
          colorHex: updatedEvent.colorHex,
          tag: updatedEvent.tag,
        },
        eventIdObj,
        (updatedEvent as any).groupId,
      );

      return updatedEvent;
    }

    return updatedEvent;
  }



  async delete(userId: string, eventId: string): Promise<{ message: string }> {
    const event = await this.eventModel.findOneAndDelete({
      _id: eventId,
      userId,
    });
    if (!event) throw new NotFoundException('Event not found');

    await this.monthlyCalendarModel.updateMany(
      { userId, 'eventsInMonth.originalEventId': eventId },
      { $pull: { eventsInMonth: { originalEventId: eventId } } },
    );

    return { message: 'Event deleted successfully' };
  }

  async getHeatmap(
    groupId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Group heatmap: count busy members per 30-minute slot across the group's users.
    // Note: This implementation uses existing MonthlyCalendar documents and builds slots in application code.
    if (!groupId) return { groupId, timeSlots: [] };

    // Load group members directly from the `groups` collection (this service is not wired with Group model).
    const groupDoc = await this.eventModel.db
      .collection('groups')
      .findOne({ _id: groupId as any });
    const memberIds: string[] = ((groupDoc as any)?.members || []).map(
      (m: any) => m.toString(),
    );

    if (memberIds.length === 0) {
      return { groupId, timeSlots: [] };
    }

    // Determine month based on startDate.
    const monthStr = new Date(startDate).toISOString().slice(0, 7); // YYYY-MM

    const calendars = await this.eventModel.db
      .collection('monthlycalendars')
      .find({
        userId: { $in: memberIds },
        month: { $regex: `^${monthStr}` },
      })
      .toArray();

    const slots = new Map<
      string,
      { startTime: string; endTime: string; busyCount: number }
    >();

    for (const cal of calendars) {
      const eventsInMonth = cal.eventsInMonth || [];
      for (const ev of eventsInMonth) {
        if (!ev?.startTime || !ev?.endTime) continue;

        const slotStartBase = new Date(`1970-01-01T${ev.startTime}:00Z`);
        const slotEndBase = new Date(`1970-01-01T${ev.endTime}:00Z`);

        let cur = new Date(slotStartBase);
        while (cur < slotEndBase) {
          const next = new Date(cur.getTime() + 30 * 60 * 1000);
          const key = `${cur.toISOString().slice(11, 16)}-${next.toISOString().slice(11, 16)}`;
          const startTime = cur.toISOString().slice(11, 16);
          const endTime = next.toISOString().slice(11, 16);

          const existing = slots.get(key);
          if (existing) {
            existing.busyCount += 1;
          } else {
            slots.set(key, { startTime, endTime, busyCount: 1 });
          }
          cur = next;
        }
      }
    }

    return {
      groupId,
      month: monthStr,
      timeSlots: Array.from(slots.values()).sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    };
  }
}
