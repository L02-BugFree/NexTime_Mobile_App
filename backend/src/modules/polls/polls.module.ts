import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { Poll, PollSchema } from './entities/poll.schema';
import { MonthlyCalendar, MonthlyCalendarSchema } from '../schedule/entities/monthly-calendar.schema';
import { Room, RoomSchema } from '../rooms/entities/room.schema';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Poll.name, schema: PollSchema }]),
    MongooseModule.forFeature([{ name: MonthlyCalendar.name, schema: MonthlyCalendarSchema }]),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    forwardRef(() => ScheduleModule),
  ],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}

