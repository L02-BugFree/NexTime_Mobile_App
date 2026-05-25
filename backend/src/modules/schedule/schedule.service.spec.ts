import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ScheduleService } from './schedule.service';
import { Event } from './entities/event.schema';
import { MonthlyCalendar } from './entities/monthly-calendar.schema';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let eventModel: any;
  let monthlyCalendarModel: any;

  beforeEach(async () => {
    const eventModelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      db: {
        collection: jest.fn().mockImplementation((name: string) => {
          if (name === 'groups') {
            return { findOne: jest.fn().mockResolvedValue({ members: ['u1', 'u2'] }) };
          }
          return {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
          };
        }),
      },
    };

    const monthlyCalendarModelMock = {
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModelMock,
        },
        {
          provide: getModelToken(MonthlyCalendar.name),
          useValue: monthlyCalendarModelMock,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    eventModel = module.get(getModelToken(Event.name));
    monthlyCalendarModel = module.get(getModelToken(MonthlyCalendar.name));
  });

  it('creates weekly event and populates occurrences', async () => {
    const dto = { title: 'Weekly', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', colorHex: '#fff' };
    const created = { _id: 'e1' };
    eventModel.create.mockResolvedValue(created);
    const popSpy = jest.spyOn(service as any, 'populateWeeklyOccurrences').mockResolvedValue(undefined);

    const result = await service.createWeekly(dto, 'u1', 'g1');
    expect(result).toEqual(created);
    expect(eventModel.create).toHaveBeenCalled();
    expect(popSpy).toHaveBeenCalled();
  });

  it('creates oneshot event and updates month calendar', async () => {
    eventModel.create.mockResolvedValue({ _id: 'e1' });
    monthlyCalendarModel.findOneAndUpdate.mockResolvedValue({});

    const result = await service.createOneshot('u1', {
      title: 'One',
      description: 'desc',
      date: '2026-05-10',
      startTime: '10:00',
      endTime: '11:00',
      colorHex: '#fff',
      tag: 'tag',
    } as any);

    expect(result).toEqual({ _id: 'e1' });
    expect(monthlyCalendarModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('returns monthly events for specific user', async () => {
    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          { userId: { toString: () => 'u1' }, eventsInMonth: [{ id: 1 }] },
          { userId: { toString: () => 'u2' }, eventsInMonth: [{ id: 2 }] },
        ]),
      }),
    });

    const result = await service.getMonthly('u1', '2026-05');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('getMonthly uses current month when month is omitted', async () => {
    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([{ userId: { toString: () => 'u1' }, eventsInMonth: [] }]),
      }),
    });

    const result = await service.getMonthly('u1');
    expect(Array.isArray(result)).toBe(true);
    expect(monthlyCalendarModel.find).toHaveBeenCalledWith({ month: expect.any(String) });
  });

  it('findAll/findOne proxies to model queries', async () => {
    eventModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'e1' }]) });
    eventModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'e1' }) });

    await expect(service.findAll('g1')).resolves.toEqual([{ _id: 'e1' }]);
    await expect(service.findOne('e1')).resolves.toEqual({ _id: 'e1' });
  });

  it('update throws NotFound when event not found', async () => {
    eventModel.findOne.mockResolvedValue(null);
    await expect(service.update('u1', 'e1', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update rewrites calendar slot and returns updated event', async () => {
    eventModel.findOne.mockResolvedValue({
      _id: 'e1',
      title: 't',
      description: 'd',
      startTime: '2026-05-10T10:00:00.000Z',
      endTime: '2026-05-10T11:00:00.000Z',
      colorHex: '#fff',
      type: 'oneshot',
    });
    eventModel.findByIdAndUpdate.mockResolvedValue({ _id: 'e1' });
    eventModel.findById.mockResolvedValue({ _id: 'e1', title: 'new' });
    monthlyCalendarModel.updateMany.mockResolvedValue({});
    monthlyCalendarModel.findOneAndUpdate.mockResolvedValue({});

    const result = await service.update('u1', 'e1', { title: 'new' });
    expect(result).toEqual({ _id: 'e1', title: 'new' });
  });

  it('delete throws NotFound when event does not exist', async () => {
    eventModel.findOneAndDelete.mockResolvedValue(null);
    await expect(service.delete('u1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete removes event and related month slots', async () => {
    eventModel.findOneAndDelete.mockResolvedValue({ _id: 'e1' });
    monthlyCalendarModel.updateMany.mockResolvedValue({});

    const result = await service.delete('u1', 'e1');
    expect(result).toEqual({ message: 'Event deleted successfully' });
  });

  it('getHeatmap returns empty slots when no groupId', async () => {
    const result = await service.getHeatmap('', new Date('2026-05-01'), new Date('2026-05-31'));
    expect(result).toEqual({ groupId: '', timeSlots: [] });
  });

  it('getHeatmap returns aggregated slots for member calendars', async () => {
    eventModel.db.collection = jest.fn().mockImplementation((name: string) => {
      if (name === 'groups') {
        return { findOne: jest.fn().mockResolvedValue({ members: ['u1'] }) };
      }
      return {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            {
              eventsInMonth: [
                { startTime: '10:00', endTime: '11:00' },
              ],
            },
          ]),
        }),
      };
    });

    const result = await service.getHeatmap('g1', new Date('2026-05-10'), new Date('2026-05-31'));
    expect(result.groupId).toBe('g1');
    expect(result.timeSlots.length).toBeGreaterThan(0);
  });

  it('getHeatmap returns empty when group has no members', async () => {
    eventModel.db.collection = jest.fn().mockImplementation((name: string) => {
      if (name === 'groups') {
        return { findOne: jest.fn().mockResolvedValue({ members: [] }) };
      }
      return {
        find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      };
    });

    const result = await service.getHeatmap('g-empty', new Date('2026-05-10'), new Date('2026-05-31'));
    expect(result).toEqual({ groupId: 'g-empty', timeSlots: [] });
  });

  it('private populateWeeklyOccurrences updates months and pushes slots', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    monthlyCalendarModel.updateMany.mockResolvedValue({});
    monthlyCalendarModel.findOneAndUpdate.mockResolvedValue({});

    await (service as any).populateWeeklyOccurrences(
      'u1',
      { title: 'W', description: 'D', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', colorHex: '#fff' },
      new Types.ObjectId(),
    );

    expect(monthlyCalendarModel.updateMany).toHaveBeenCalled();
    expect(monthlyCalendarModel.findOneAndUpdate).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('private populateOneShotOccurrence saves existing calendar', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    monthlyCalendarModel.findOne.mockResolvedValue({ eventsInMonth: [], save });

    await (service as any).populateOneShotOccurrence(
      'u1',
      {
        title: 'One',
        description: 'desc',
        fullDate: new Date('2026-05-20T00:00:00.000Z'),
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:00',
        colorHex: '#fff',
        type: 'oneshot',
      },
      new Types.ObjectId(),
    );

    expect(save).toHaveBeenCalled();
  });

  it('private populateOneShotOccurrence creates calendar when missing', async () => {
    monthlyCalendarModel.findOne.mockResolvedValue(null);
    monthlyCalendarModel.create.mockResolvedValue({});

    await (service as any).populateOneShotOccurrence(
      'u1',
      {
        title: 'One',
        description: 'desc',
        fullDate: new Date('2026-05-20T00:00:00.000Z'),
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:00',
        colorHex: '#fff',
        type: 'oneshot',
      },
      new Types.ObjectId(),
    );

    expect(monthlyCalendarModel.create).toHaveBeenCalled();
  });

  it('private helpers slotsOverlap and generateSlots work', () => {
    const overlap = (service as any).slotsOverlap(
      new Date('2026-05-10T10:00:00.000Z'),
      new Date('2026-05-10T11:00:00.000Z'),
      new Date('2026-05-10T10:30:00.000Z'),
      new Date('2026-05-10T11:30:00.000Z'),
    );
    const noOverlap = (service as any).slotsOverlap(
      new Date('2026-05-10T10:00:00.000Z'),
      new Date('2026-05-10T10:30:00.000Z'),
      new Date('2026-05-10T10:30:00.000Z'),
      new Date('2026-05-10T11:00:00.000Z'),
    );
    const slots = (service as any).generateSlots(
      new Date('2026-05-10T10:00:00.000Z'),
      new Date('2026-05-10T11:00:00.000Z'),
    );

    expect(overlap).toBe(true);
    expect(noOverlap).toBe(false);
    expect(slots).toHaveLength(2);
  });
});

