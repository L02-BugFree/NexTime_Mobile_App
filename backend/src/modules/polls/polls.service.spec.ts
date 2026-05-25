import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PollsService } from './polls.service';
import { Poll } from './entities/poll.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { Room, RoomType } from '../rooms/entities/room.schema';

describe('PollsService', () => {
  let service: PollsService;
  let pollModel: any;
  let monthlyCalendarModel: any;
  let roomModel: any;

  beforeEach(async () => {
    const pollSave = jest.fn().mockResolvedValue({ _id: 'p1' });

    const pollModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      votes: data.votes || [],
      save: pollSave,
    }));

    pollModelMock.findById = jest.fn();

    const monthlyCalendarModelMock = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const roomModelMock = {
      findById: jest.fn(),
      populate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: getModelToken(Poll.name), useValue: pollModelMock },
        { provide: getModelToken(MonthlyCalendar.name), useValue: monthlyCalendarModelMock },
        { provide: getModelToken(Room.name), useValue: roomModelMock },
      ],
    }).compile();

    service = module.get(PollsService);
    pollModel = module.get(getModelToken(Poll.name));
    monthlyCalendarModel = module.get(getModelToken(MonthlyCalendar.name));
    roomModel = module.get(getModelToken(Room.name));
  });

  const uid = '507f1f77bcf86cd799439011';
  const uid2 = '507f1f77bcf86cd799439012';

  it('throws when room does not exist for poll creation', async () => {
    roomModel.findById.mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

    await expect(service.createPoll(uid, { roomId: uid2, options: [] } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when requester is not member of room', async () => {
    roomModel.findById.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue({ type: RoomType.SELF, ownerId: new Types.ObjectId(uid2) }) }),
    });

    await expect(service.createPoll(uid, { roomId: uid2, options: [] } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when poll members include outsider', async () => {
    roomModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          type: RoomType.DIRECT,
          ownerId: new Types.ObjectId(uid),
          userA: new Types.ObjectId(uid),
          userB: new Types.ObjectId(uid2),
        }),
      }),
    });

    await expect(
      service.createPoll(uid, {
        roomId: uid2,
        members: [uid, '507f1f77bcf86cd799439013'],
        options: [{ startTime: '10:00', endTime: '11:00' }],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates poll successfully with default members', async () => {
    roomModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          type: RoomType.DIRECT,
          ownerId: new Types.ObjectId(uid),
          userA: new Types.ObjectId(uid),
          userB: new Types.ObjectId(uid2),
        }),
      }),
    });

    const result = await service.createPoll(uid, {
      roomId: uid2,
      options: [{ startTime: '10:00', endTime: '11:00' }],
    } as any);

    expect(result).toEqual({ _id: 'p1' });
  });

  it('throws when poll is missing in vote', async () => {
    pollModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(service.voteAndAutoSchedule(uid, uid2, { optionIndex: 0, value: 'YES' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when user is not poll member', async () => {
    pollModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ members: [new Types.ObjectId(uid2)], options: [{ startTime: '10:00', endTime: '11:00' }] }),
    });

    await expect(service.voteAndAutoSchedule(uid, uid2, { optionIndex: 0, value: 'YES' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when option index is invalid', async () => {
    pollModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        members: [new Types.ObjectId(uid)],
        options: [],
        votes: [],
        save: jest.fn().mockResolvedValue(undefined),
      }),
    });

    await expect(service.voteAndAutoSchedule(uid, uid2, { optionIndex: 1, value: 'YES' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records YES vote and auto-schedules event', async () => {
    const pollDoc: any = {
      members: [new Types.ObjectId(uid)],
      options: [{ startTime: '10:00', endTime: '11:00' }],
      votes: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    pollModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(pollDoc) });

    const result = await service.voteAndAutoSchedule(uid, uid2, { optionIndex: 0, value: 'YES' } as any);

    expect(result.message).toContain('Vote recorded');
    expect(monthlyCalendarModel.updateOne).toHaveBeenCalled();
    const [, update] = monthlyCalendarModel.updateOne.mock.calls[0];
    expect(update.$addToSet.eventsInMonth.title).toContain(`POLL_${uid2}_OPTION_0`);
  });

  it('records NO vote and removes scheduled event', async () => {
    const pollDoc: any = {
      members: [new Types.ObjectId(uid)],
      options: [{ startTime: '10:00', endTime: '11:00' }],
      votes: [{ userId: new Types.ObjectId(uid), optionIndex: 0, value: 'YES' }],
      save: jest.fn().mockResolvedValue(undefined),
    };
    pollModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(pollDoc) });

    await service.voteAndAutoSchedule(uid, uid2, { optionIndex: 0, value: 'NO' } as any);

    const [, update] = monthlyCalendarModel.updateOne.mock.calls[0];
    expect(update.$pull.eventsInMonth.title).toContain(`POLL_${uid2}_OPTION_0`);
  });

  it('supports GROUP room member expansion in createPoll', async () => {
    roomModel.findById.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({
          type: RoomType.GROUP,
          ownerId: new Types.ObjectId(uid),
          groupId: new Types.ObjectId(uid2),
        }),
      }),
    });

    roomModel.populate.mockResolvedValue({
      groupId: { members: [new Types.ObjectId(uid), new Types.ObjectId(uid2)] },
      ownerId: new Types.ObjectId(uid),
    });

    const result = await service.createPoll(uid, {
      roomId: uid2,
      members: [uid2],
      options: [{ startTime: '10:00', endTime: '11:00' }],
    } as any);

    expect(result).toEqual({ _id: 'p1' });
  });
});
