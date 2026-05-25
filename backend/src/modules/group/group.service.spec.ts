import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupService } from './group.service';
import { Group } from './entities/group.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';

describe('GroupService', () => {
  let service: GroupService;
  let groupModel: any;
  let monthlyCalendarModel: any;

  beforeEach(async () => {
    const groupSave = jest.fn().mockResolvedValue({ _id: 'g1' });
    const groupModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: groupSave,
    }));

    groupModelMock.find = jest.fn();
    groupModelMock.findById = jest.fn();
    groupModelMock.updateMany = jest.fn().mockResolvedValue({ acknowledged: true });

    const monthlyCalendarModelMock = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getModelToken(Group.name),
          useValue: groupModelMock,
        },
        {
          provide: getModelToken(MonthlyCalendar.name),
          useValue: monthlyCalendarModelMock,
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupModel = module.get(getModelToken(Group.name));
    monthlyCalendarModel = module.get(getModelToken(MonthlyCalendar.name));
  });

  it('creates group and auto-includes creator in members', async () => {
    const result = await service.create('507f1f77bcf86cd799439011', {
      name: 'Core Team',
      members: ['507f1f77bcf86cd799439012'],
    } as any);

    expect(result).toEqual({ _id: 'g1' });
    expect(groupModel).toHaveBeenCalled();
  });

  it('returns populated groups in findAll', async () => {
    const exec = jest.fn().mockResolvedValue([{ _id: 'g1' }]);
    const populate = jest.fn().mockReturnValue({ exec });
    groupModel.find.mockReturnValue({ populate });

    const groups = await service.findAll('507f1f77bcf86cd799439011');
    expect(groups).toEqual([{ _id: 'g1' }]);
  });

  it('throws NotFoundException when group does not exist', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    });

    await expect(service.getHeatmap('u1', 'g1', '2026-05')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException for non-members', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({ members: [{ toString: () => 'other-user' }] }),
      }),
    });

    await expect(service.getHeatmap('u1', 'g1', '2026-05')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('builds heatmap slots for member events', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          members: [{ toString: () => 'u1' }, { toString: () => 'u2' }],
        }),
      }),
    });

    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: { toString: () => 'u1' },
            eventsInMonth: [
              {
                fullDate: '2026-05-10T00:00:00.000Z',
                startTime: '10:00',
                endTime: '11:00',
              },
            ],
          },
        ]),
      }),
    });

    const result = await service.getHeatmap('u1', 'g1', '2026-05');

    const targetSlot = result.timeSlots.find((slot: any) => slot.date === '2026-05-10' && slot.startTime === '10:00');
    expect(result.groupId).toBe('g1');
    expect(result.month).toBe('2026-05');
    expect(targetSlot.busyCount).toBeGreaterThan(0);
  });

  it('throws BadRequestException when month format is invalid', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          members: [{ toString: () => 'u1' }],
        }),
      }),
    });

    await expect(service.getHeatmap('u1', 'g1', '2026/05')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ignores invalid events and keeps busyCount unchanged', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          members: [{ toString: () => 'u1' }],
        }),
      }),
    });

    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: { toString: () => 'u1' },
            eventsInMonth: [
              { fullDate: 'invalid-date', startTime: '10:00', endTime: '11:00' },
              { fullDate: '2026-05-10T00:00:00.000Z', startTime: undefined, endTime: '11:00' },
              { fullDate: '2026-05-10T00:00:00.000Z', startTime: '11:00', endTime: '10:00' },
              { fullDate: '2026-05-10T00:00:00.000Z', startTime: 'aa:bb', endTime: 'cc:dd' },
            ],
          },
        ]),
      }),
    });

    const result = await service.getHeatmap('u1', 'g1', '2026-05');
    const slot = result.timeSlots.find((x: any) => x.date === '2026-05-10' && x.startTime === '10:00');

    expect(slot).toBeDefined();
    expect(slot.busyCount).toBe(0);
  });

  it('removes user from all groups by object id', async () => {
    await service.removeMemberFromAllGroups('507f1f77bcf86cd799439011');

    expect(groupModel.updateMany).toHaveBeenCalledTimes(1);
    const [filter, update] = groupModel.updateMany.mock.calls[0];
    expect(filter.members.toHexString()).toBe('507f1f77bcf86cd799439011');
    expect(update.$pull.members.toHexString()).toBe('507f1f77bcf86cd799439011');
  });

  it('uses current month when month is not provided', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          members: [{ toString: () => 'u1' }],
        }),
      }),
    });

    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue([]) }),
    });

    const result = await service.getHeatmap('u1', 'g1');
    expect(result.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it('filters out calendars not belonging to group members', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          members: [{ toString: () => 'u1' }],
        }),
      }),
    });

    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: { toString: () => 'outsider' },
            eventsInMonth: [
              {
                fullDate: '2026-05-10T00:00:00.000Z',
                startTime: '10:00',
                endTime: '11:00',
              },
            ],
          },
          {
            userId: { toString: () => 'u1' },
            eventsInMonth: undefined,
          },
        ]),
      }),
    });

    const result = await service.getHeatmap('u1', 'g1', '2026-05');
    const slot = result.timeSlots.find((x: any) => x.date === '2026-05-10' && x.startTime === '10:00');
    expect(slot.busyCount).toBe(0);
  });
});
