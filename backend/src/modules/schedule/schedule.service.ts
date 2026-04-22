import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './entities/event.schema';
import { MonthlyCalendar } from './entities/monthly-calendar.schema';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(MonthlyCalendar.name) private monthlyCalendarModel: Model<MonthlyCalendar>,
  ) {}

  async createWeekly(createWeeklyDto: any, userId: string, groupId?: string) {
    const data = { ...createWeeklyDto, type: 'weekly', userId, groupId };
    const event = await this.eventModel.create(data);
    const eventId = event._id;
    await this.populateWeeklyOccurrences(userId, createWeeklyDto, eventId, groupId);
    return event;
  }

  async createOneShot(createOneShotDto: any, userId: string, groupId?: string) {
    const data = { ...createOneShotDto, type: 'oneshot', userId, groupId };
    const event = await this.eventModel.create(data);
    const eventId = event._id;
    const startTime = new Date(createOneShotDto.startTime);
    const dayOfWeek = startTime.getDay() || 7; // 1-7
    await this.populateOneShotOccurrence(userId, {
      title: createOneShotDto.title,
      description: createOneShotDto.description,
      fullDate: startTime,
      dayOfWeek,
      startTime: createOneShotDto.startTime,
      endTime: createOneShotDto.endTime,
      colorHex: createOneShotDto.colorHex,
      type: 'oneshot',
    }, eventId, groupId);
    return event;
  }

  private async populateWeeklyOccurrences(userId: string, dto: any, eventId: Types.ObjectId, groupId?: string) {
    console.log('--- Start Populating ---');
    console.log('User:', userId, 'DayOfWeek:', dto.dayOfWeek);

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7);
    const months = [currentMonth, nextMonth];

    for (const monthStr of months) {
      console.log('Processing month:', monthStr);
      
      const year = parseInt(monthStr.slice(0, 4));
      const month = parseInt(monthStr.slice(5, 7)) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Remove existing slots for this event (separate ops avoid conflict)
      await this.monthlyCalendarModel.updateMany(
        { userId, month: monthStr, 'eventsInMonth.originalEventId': eventId },
        { $pull: { eventsInMonth: { originalEventId: eventId } } }
      );

      // Push new slots one by one
      for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = new Date(year, month, day, 12, 0, 0);
        const jsDayOfWeek = fullDate.getDay();
        const userDayOfWeek = dto.dayOfWeek === 7 ? 0 : dto.dayOfWeek;

        if (jsDayOfWeek === userDayOfWeek) {
          console.log('Pushed slot for date:', fullDate.toISOString().slice(0, 10));
          
          await this.monthlyCalendarModel.findOneAndUpdate(
            { userId, month: monthStr },
            { 
              $push: { eventsInMonth: {
                originalEventId: eventId,
                title: dto.title,
                description: dto.description,
                fullDate,
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
                colorHex: dto.colorHex,
                type: 'weekly',
              }}
            },
            { upsert: true, returnDocument: 'after' }
          );
        }
      }

      console.log(`Processed ${daysInMonth} days for ${monthStr}`);

    }
  }

  private async populateOneShotOccurrence(userId: string, eventData: any, eventId: Types.ObjectId, groupId?: string) {
    const monthStr = eventData.fullDate.toISOString().slice(0, 7);
    
    const calendar = await this.monthlyCalendarModel.findOne({ userId, month: monthStr });
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
      await this.monthlyCalendarModel.create({ userId, month: monthStr, eventsInMonth });
    }
  }

  async getHeatmap(groupId: string, startDate: Date, endDate: Date) {
    // TODO: Get real group members from GroupService
    const mockMembers = ['mockuser1', 'mockuser2'];
    const monthStr = startDate.toISOString().slice(0, 7);

    const calendars = await this.monthlyCalendarModel.find({
      userId: { $in: mockMembers },
      month: monthStr,
    });

    const slots: any[] = this.generateSlots(startDate, endDate);

    calendars.forEach(calendar => {
      calendar.eventsInMonth.forEach((event: any) => {
        const eventStart = new Date(event.fullDate);
        const eventEnd = new Date(eventStart.getTime() + parseInt(event.endTime.split(':')[0]) * 60 * 60 * 1000 + parseInt(event.endTime.split(':')[1]) * 60 * 1000);
        slots.forEach((s: any) => {
          if (this.slotsOverlap(eventStart, eventEnd, new Date(s.startTime), new Date(s.endTime))) {
            s.busyCount++;
            s.avatars.push('https://example.com/avatar.jpg');
          }
        });
      });
    });

    slots.forEach((s: any) => {
      s.isConflict = s.busyCount / mockMembers.length > 0.8;
    });

    return { groupId, slots };
  }

  private slotsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  private generateSlots(start: Date, end: Date) {
    const slots: any[] = [];
    const current = new Date(start);
    while (current < end) {
      const endSlot = new Date(current.getTime() + 30 * 60 * 1000);
      slots.push({ busyCount: 0, avatars: [], startTime: current.toISOString(), endTime: endSlot.toISOString(), isConflict: false });
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

  async update(id: string, updateEventDto: any) {
    return this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }
}
