import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';

export interface HeatmapSlot {
  date: string;
  startTime: string;
  endTime: string;
  busyCount: number;
}

@Injectable()
export class HeatmapService {
  constructor(
    @InjectModel(MonthlyCalendar.name)
    private monthlyCalendarModel: Model<MonthlyCalendar>,
  ) {}

  async generateHeatmap(
    userIds: string[],
    month?: string,
    privacyCheck?: (userId: string) => Promise<boolean>, // Optional privacy filter
  ): Promise<HeatmapSlot[]> {
    const monthStr = this.validateMonth(month);
    const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);
    const monthEnd = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );

    // Filter users based on privacy if needed
    let filteredUserIds = userIds;
    if (privacyCheck) {
      const privacyResults = await Promise.all(
        userIds.map(async (id) => ({
          id,
          isVisible: await privacyCheck(id),
        })),
      );
      filteredUserIds = privacyResults
        .filter((result) => result.isVisible)
        .map((result) => result.id);
    }

    const memberIdSet = new Set(filteredUserIds);
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

    return Array.from(slotMap.values());
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
