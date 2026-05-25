import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import { Room, RoomType } from './entities/room.schema';
import { Message } from './entities/message.schema';
import { Group } from '../group/entities/group.schema';
import { User } from '../user/entities/user.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomModel: any;
  let messageModel: any;
  let groupModel: any;
  let userModel: any;
  let monthlyCalendarModel: any;

  beforeEach(async () => {
    const roomSave = jest.fn().mockResolvedValue({ _id: 'r1' });
    const messageSave = jest.fn().mockResolvedValue({ _id: 'm1', content: 'hello' });

    const roomModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: roomSave,
    }));
    roomModelMock.findById = jest.fn();
    roomModelMock.find = jest.fn();
    roomModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    const messageModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: messageSave,
    }));
    messageModelMock.find = jest.fn();

    const groupModelMock = {
      findById: jest.fn(),
      find: jest.fn(),
    };

    const userModelMock = {
      findById: jest.fn(),
    };

    const monthlyCalendarModelMock = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: roomModelMock },
        { provide: getModelToken(Message.name), useValue: messageModelMock },
        { provide: getModelToken(Group.name), useValue: groupModelMock },
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(MonthlyCalendar.name), useValue: monthlyCalendarModelMock },
      ],
    }).compile();

    service = module.get(RoomsService);
    roomModel = module.get(getModelToken(Room.name));
    messageModel = module.get(getModelToken(Message.name));
    groupModel = module.get(getModelToken(Group.name));
    userModel = module.get(getModelToken(User.name));
    monthlyCalendarModel = module.get(getModelToken(MonthlyCalendar.name));
  });

  const uid = '507f1f77bcf86cd799439011';
  const uid2 = '507f1f77bcf86cd799439012';

  it('throws when creating GROUP room without groupId', async () => {
    await expect(service.createRoom(uid, { type: RoomType.GROUP } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when creating GROUP room for missing group', async () => {
    groupModel.findById.mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

    await expect(service.createRoom(uid, { type: RoomType.GROUP, groupId: uid2 } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when requester is not group member', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue({ members: [{ toString: () => uid2 }] }) }),
    });

    await expect(service.createRoom(uid, { type: RoomType.GROUP, groupId: uid2 } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws for invalid DIRECT payload', async () => {
    await expect(service.createRoom(uid, { type: RoomType.DIRECT, userA: uid } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createRoom(uid, { type: RoomType.DIRECT, userA: uid, userB: uid } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createRoom(uid, { type: RoomType.DIRECT, userA: uid2, userB: '507f1f77bcf86cd799439013' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws for missing direct participants in DB', async () => {
    userModel.findById
      .mockReturnValueOnce({ select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: uid }) }) }) })
      .mockReturnValueOnce({ select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }) });

    await expect(service.createRoom(uid, { type: RoomType.DIRECT, userA: uid, userB: uid2 } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates DIRECT room successfully', async () => {
    userModel.findById
      .mockReturnValueOnce({ select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: uid }) }) }) })
      .mockReturnValueOnce({ select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: uid2 }) }) }) });

    const result = await service.createRoom(uid, { type: RoomType.DIRECT, userA: uid, userB: uid2 } as any);
    expect(result).toEqual({ _id: 'r1' });
  });

  it('throws for SELF room with extra participant fields', async () => {
    await expect(service.createRoom(uid, { type: RoomType.SELF, userA: uid2 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists rooms for user with group memberships', async () => {
    groupModel.find.mockReturnValue({ select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(uid2) }]) }) }) });
    roomModel.find.mockReturnValue({ sort: () => ({ exec: jest.fn().mockResolvedValue([{ _id: 'r1' }]) }) });

    const result = await service.listRoomsForUser(uid);
    expect(result).toEqual([{ _id: 'r1' }]);
  });

  it('gets paginated messages with computed skip', async () => {
    roomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'r1', type: RoomType.SELF, ownerId: new Types.ObjectId(uid) }) });
    messageModel.find.mockReturnValue({
      sort: () => ({ skip: () => ({ limit: () => ({ exec: jest.fn().mockResolvedValue([{ _id: 'm1' }]) }) }) }),
    });

    const result = await service.getMessages(uid, uid2, { page: 2, limit: 10 } as any);
    expect(result.items).toEqual([{ _id: 'm1' }]);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('sends message for room member and updates room timestamp', async () => {
    roomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: uid2, type: RoomType.SELF, ownerId: new Types.ObjectId(uid) }) });

    const result = await service.sendMessage(uid, uid2, { content: 'hello' } as any);
    expect(result).toEqual({ _id: 'm1', content: 'hello' });
    expect(roomModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('blocks DIRECT heatmap when other user privacy is anonymous', async () => {
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: uid2,
        type: RoomType.DIRECT,
        ownerId: new Types.ObjectId(uid),
        userA: new Types.ObjectId(uid),
        userB: new Types.ObjectId(uid2),
      }),
    });
    userModel.findById.mockReturnValue({
      select: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue({ privacySettings: { anonymousOnGroupCalendar: true } }) }) }),
    });

    await expect(service.getHeatmap(uid, uid2, '2026-05')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws for invalid month in heatmap', async () => {
    roomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: uid2, type: RoomType.SELF, ownerId: new Types.ObjectId(uid) }) });
    monthlyCalendarModel.find.mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue([]) }) });

    await expect(service.getHeatmap(uid, uid2, '2026/05')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('builds heatmap and ignores invalid calendar events', async () => {
    roomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: uid2, type: RoomType.SELF, ownerId: new Types.ObjectId(uid) }) });
    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: new Types.ObjectId(uid),
            eventsInMonth: [
              { fullDate: 'invalid', startTime: '10:00', endTime: '11:00' },
              { fullDate: '2026-05-10T00:00:00.000Z', startTime: '10:00', endTime: '11:00' },
            ],
          },
        ]),
      }),
    });

    const result = await service.getHeatmap(uid, uid2, '2026-05');
    const slot = result.timeSlots.find((x: any) => x.date === '2026-05-10' && x.startTime === '10:00');
    expect(slot.busyCount).toBeGreaterThan(0);
  });

  it('throws when getting messages for missing room', async () => {
    roomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(service.getMessages(uid, uid2, {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws forbidden when user has no access to room messages', async () => {
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: uid2, type: RoomType.SELF, ownerId: new Types.ObjectId(uid2) }),
    });

    await expect(service.getMessages(uid, uid2, {} as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('private validateMonth and combineDateAndTimeUtc cover edge inputs', () => {
    const defaultMonth = (service as any).validateMonth();
    expect(defaultMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(() => (service as any).validateMonth('2026/05')).toThrow(BadRequestException);

    const baseDate = new Date('2026-05-10T00:00:00.000Z');
    expect((service as any).combineDateAndTimeUtc(baseDate, undefined)).toBeNull();
    expect((service as any).combineDateAndTimeUtc(baseDate, 'aa:bb')).toBeNull();
    expect((service as any).combineDateAndTimeUtc(baseDate, '10:30')?.toISOString()).toContain('T10:30:00.000Z');
  });

  it('private getRoomMemberIds handles malformed DIRECT and GROUP data', async () => {
    await expect(
      (service as any).getRoomMemberIds({
        type: RoomType.DIRECT,
        ownerId: new Types.ObjectId(uid),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      (service as any).getRoomMemberIds({
        type: RoomType.GROUP,
        ownerId: new Types.ObjectId(uid),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    groupModel.findById.mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });
    await expect(
      (service as any).getRoomMemberIds({
        type: RoomType.GROUP,
        ownerId: new Types.ObjectId(uid),
        groupId: new Types.ObjectId(uid2),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('private getRoomMemberIds returns owner + group members on GROUP room', async () => {
    groupModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({ members: [new Types.ObjectId(uid), new Types.ObjectId(uid2)] }),
      }),
    });

    const members = await (service as any).getRoomMemberIds({
      type: RoomType.GROUP,
      ownerId: new Types.ObjectId(uid),
      groupId: new Types.ObjectId(uid2),
    });

    expect(members).toContain(uid);
    expect(members).toContain(uid2);
  });

  it('private createMonthSlotMap generates 30-minute slots', () => {
    const slots = (service as any).createMonthSlotMap(
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-01T01:00:00.000Z'),
    );

    expect(slots.size).toBe(2);
  });

  it('gets GROUP heatmap and includes group member calendars', async () => {
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: uid2,
        type: RoomType.GROUP,
        ownerId: new Types.ObjectId(uid),
        groupId: new Types.ObjectId(uid2),
      }),
    });
    groupModel.findById.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue({ members: [new Types.ObjectId(uid2)] }) }),
    });
    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: new Types.ObjectId(uid2),
            eventsInMonth: [{ fullDate: '2026-05-10T00:00:00.000Z', startTime: '10:00', endTime: '10:30' }],
          },
        ]),
      }),
    });

    const result = await service.getHeatmap(uid, uid2, '2026-05');
    expect(result.timeSlots.length).toBeGreaterThan(0);
  });

  it('ignores event slots outside selected month boundaries', async () => {
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: uid2, type: RoomType.SELF, ownerId: new Types.ObjectId(uid) }),
    });
    monthlyCalendarModel.find.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue([
          {
            userId: new Types.ObjectId(uid),
            eventsInMonth: [{ fullDate: '2026-06-10T00:00:00.000Z', startTime: '10:00', endTime: '11:00' }],
          },
        ]),
      }),
    });

    const result = await service.getHeatmap(uid, uid2, '2026-05');
    const maySlot = result.timeSlots.find((x: any) => x.date === '2026-05-10' && x.startTime === '10:00');
    expect(maySlot?.busyCount ?? 0).toBe(0);
  });
});
