import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { Poll, VoteValue } from './entities/poll.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { OneShotEvent } from '../schedule/entities/one-shot-event.schema';

@Injectable()
export class PollsService {
  constructor(
    @InjectModel(Poll.name) private pollModel: Model<Poll>,
    @InjectModel(MonthlyCalendar.name) private monthlyCalendarModel: Model<MonthlyCalendar>,
    @InjectModel(OneShotEvent.name) private oneShotEventModel: Model<OneShotEvent>,
  ) {}

  async createPoll(userId: string, dto: CreatePollDto): Promise<Poll> {
    const created = new this.pollModel({
      roomId: dto.roomId,
      members: dto.members?.length ? dto.members : [userId],
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

//   async voteAndAutoSchedule(userId: string, pollId: string, dto: VoteDto) {
//     const poll = await this.pollModel.findById(pollId).exec();
//     if (!poll) throw new NotFoundException('Poll not found');

//     const option = poll.options[dto.optionIndex];
//     if (!option) throw new BadRequestException('Invalid optionIndex');

//     // Update votes first
//     await this.upsertVote(poll, userId, dto.optionIndex, dto.value);

//     const monthStr = new Date().toISOString().slice(0, 7);

//     const calendar = await this.monthlyCalendarModel
//       .findOne({ userId, month: monthStr })
//       .exec();

//     // ensure calendar exists
//     const calendarToUse =
//       calendar ||
//       (await this.monthlyCalendarModel
//         .create({ userId: new Types.ObjectId(userId), month: monthStr, eventsInMonth: [] } as any));

//     // Auto-schedule mapping: we create/delete oneshot events tied to pollId + optionIndex.
//     const eventMarkerTitle = `POLL_${pollId}_OPTION_${dto.optionIndex}`;

//     if (dto.value === 'YES') {
//       // create oneshot entry if not exists
//       const already = calendarToUse.eventsInMonth?.some((e: any) => e.title === eventMarkerTitle);
//       if (!already) {
//         const oneshotDate = new Date();
//         const createdOneShot = await this.oneShotEventModel.create({
//           title: eventMarkerTitle,
//           description: 'Auto-scheduled from poll vote',
//           startTime: option.startTime,
//           endTime: option.endTime,
//           date: oneshotDate,
//           colorHex: '#00C2FF',
//           tag: 'poll',
//         } as any);

//         // push to MonthlyCalendar
//         await this.monthlyCalendarModel.updateOne(
//           { _id: calendarToUse._id },
//           {
//             $addToSet: {
//               eventsInMonth: {
//                 // For poll auto-scheduling compliance, mark the originalEventId as the poll option marker.
//                 originalEventId: new Types.ObjectId(),
//                 title: createdOneShot.title,
//                 description: createdOneShot.description,
// fullDate: (createdOneShot as any).specificDate ?? (createdOneShot as any).date,
//                 dayOfWeek: oneshotDate.getDay() || 7,
//                 startTime: createdOneShot.startTime,
//                 endTime: createdOneShot.endTime,
//                 colorHex: createdOneShot.colorHex,
//                 type: 'oneshot',
//               },
//             },
//           },
//         );

//       }
//     } else {
//       // pull matching oneshot entries (by originalEventId)
//       await this.monthlyCalendarModel.updateOne(
//         { _id: calendarToUse._id },
//         { $pull: { eventsInMonth: { title: eventMarkerTitle } } },
//       );


//       // optional: delete OneShotEvent docs could be done, omitted for safety.
//     }

//     return { message: 'Vote recorded (and auto-scheduling applied where applicable)' };
//   }

  async voteAndAutoSchedule(userId: string, pollId: string, dto: VoteDto) {
    const poll = await this.pollModel.findById(pollId).exec();
    if (!poll) throw new NotFoundException('Poll not found');

    const option = poll.options[dto.optionIndex];
    if (!option) throw new BadRequestException('Invalid optionIndex');

    // 1. Cập nhật vote
    await this.upsertVote(poll, userId, dto.optionIndex, dto.value);

    // 2. Deterministic marker ID (theo spec)
    const markerId = `POLL_${pollId}_OPT_${dto.optionIndex}`;
    const monthStr = new Date().toISOString().slice(0, 7);

    // 3. Lấy hoặc tạo calendar của user
    let calendar = await this.monthlyCalendarModel
      .findOne({ userId: new Types.ObjectId(userId), month: monthStr })
      .exec();

    if (!calendar) {
      calendar = await this.monthlyCalendarModel.create({
        userId: new Types.ObjectId(userId),
        month: monthStr,
        eventsInMonth: [],
      });
    }

    if (dto.value === 'YES') {
      // Check trùng lặp theo originalEventId (deterministic)
      const already = calendar.eventsInMonth?.some(
        (e: any) => e.originalEventId === markerId
      );

      if (!already) {
        // Tạo OneShotEvent (có thể bỏ qua nếu không cần lưu riêng)
        const oneshotDate = new Date();
        await this.oneShotEventModel.create({
          title: `Poll Option ${dto.optionIndex + 1}`,
          description: `Auto-scheduled from poll ${pollId}`,
          startTime: option.startTime,
          endTime: option.endTime,
          date: oneshotDate,
          colorHex: '#00C2FF',
          tag: 'poll',
        });

        // Push vào MonthlyCalendar với originalEventId = markerId
        await this.monthlyCalendarModel.updateOne(
          { _id: calendar._id },
          {
            $addToSet: {
              eventsInMonth: {
                originalEventId: markerId,  // ← deterministic!
                title: `Poll Option ${dto.optionIndex + 1}`,
                description: `Auto-scheduled from poll ${pollId}`,
                fullDate: oneshotDate,
                dayOfWeek: oneshotDate.getDay() || 7,
                startTime: option.startTime,
                endTime: option.endTime,
                colorHex: '#00C2FF',
                type: 'oneshot',
              },
            },
          }
        );
      }
    } else {
      // NO: Pull theo originalEventId (không dùng title)
      await this.monthlyCalendarModel.updateOne(
        { _id: calendar._id },
        { $pull: { eventsInMonth: { originalEventId: markerId } } }
      );
    }

    return { message: 'Vote recorded and schedule updated' };
  }
}
