import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { Poll, VoteValue } from './entities/poll.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { Room, RoomType } from '../rooms/entities/room.schema';

@Injectable()
export class PollsService {
  constructor(
    @InjectModel(Poll.name) private pollModel: Model<Poll>,
    @InjectModel(MonthlyCalendar.name) private monthlyCalendarModel: Model<MonthlyCalendar>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
  ) {}

  async createPoll(userId: string, dto: CreatePollDto): Promise<Poll> {
    const room = await this.roomModel.findById(dto.roomId).lean().exec();
    if (!room) throw new NotFoundException('Room not found');

    const roomMemberIds = await this.getRoomMemberIds(room);
    if (!roomMemberIds.includes(userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    const members = dto.members?.length ? dto.members : [userId];
    const hasOutsider = members.some((memberId) => !roomMemberIds.includes(memberId));
    if (hasOutsider) {
      throw new BadRequestException('Poll members must belong to the room');
    }

    const created = new this.pollModel({
      roomId: dto.roomId,
      members,
      options: dto.options,
      votes: [],
    });
    return created.save();
  }

  private async upsertVote(poll: Poll, userId: string, optionIndex: number, value: VoteValue) {
    const idx = poll.votes.findIndex((v) => v.userId.toString() === userId && v.optionIndex === optionIndex);
    if (idx >= 0) {
      poll.votes[idx].value = value;
    } else {
      poll.votes.push({ optionIndex, userId: new Types.ObjectId(userId), value });
    }
    await poll.save();
  }

  async voteAndAutoSchedule(userId: string, pollId: string, dto: VoteDto) {
    const poll = await this.pollModel.findById(pollId).exec();
    if (!poll) throw new NotFoundException('Poll not found');
    if (!(poll.members ?? []).some((memberId) => memberId.toString() === userId)) {
      throw new ForbiddenException('You are not a member of this poll');
    }

    const option = poll.options[dto.optionIndex];
    if (!option) throw new BadRequestException('Invalid optionIndex');

    // Update votes first
    await this.upsertVote(poll, userId, dto.optionIndex, dto.value);

    const monthStr = new Date().toISOString().slice(0, 7);
    const userObjectId = new Types.ObjectId(userId);

    // Auto-schedule mapping: we create/delete oneshot events tied to pollId + optionIndex.
    const eventMarkerTitle = `POLL_${pollId}_OPTION_${dto.optionIndex}`;
    const fullDate = new Date();

    if (dto.value === 'YES') {
      await this.monthlyCalendarModel.updateOne(
        { userId: userObjectId, month: monthStr },
        {
          $setOnInsert: { userId: userObjectId, month: monthStr },
          $addToSet: {
            eventsInMonth: {
              originalEventId: new Types.ObjectId(),
              title: eventMarkerTitle,
              description: 'Auto-scheduled from poll vote',
              fullDate,
              dayOfWeek: fullDate.getDay() || 7,
              startTime: option.startTime,
              endTime: option.endTime,
              colorHex: '#00C2FF',
              type: 'oneshot',
            },
          },
        },
        { upsert: true },
      );
    } else {
      await this.monthlyCalendarModel.updateOne(
        { userId: userObjectId, month: monthStr },
        { $pull: { eventsInMonth: { title: eventMarkerTitle } } },
      );
    }

    return { message: 'Vote recorded (and auto-scheduling applied where applicable)' };
  }

  private async getRoomMemberIds(room: Room | (Room & { _id?: Types.ObjectId })): Promise<string[]> {
    if (room.type === RoomType.SELF) {
      return [room.ownerId.toString()];
    }

    if (room.type === RoomType.DIRECT) {
      const userA = room.userA?.toString();
      const userB = room.userB?.toString();
      if (!userA || !userB) throw new BadRequestException('DIRECT room is missing participants');
      return [room.ownerId.toString(), userA, userB].filter((id, index, arr) => arr.indexOf(id) === index);
    }

    const groupRoom = await this.roomModel.populate(room, { path: 'groupId', select: 'members' });
    const groupMembers = ((groupRoom.groupId as any)?.members ?? []).map((memberId: Types.ObjectId) => memberId.toString());
    return [room.ownerId.toString(), ...groupMembers].filter((id, index, arr) => arr.indexOf(id) === index);
  }
}

