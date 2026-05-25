import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { Poll, PollSchema } from './entities/poll.schema';
import { MonthlyCalendar, MonthlyCalendarSchema } from '../../schedule/entities/monthly-calendar.schema';
import { OneShotEvent, OneShotEventSchema } from '../../schedule/entities/one-shot-event.schema';
import { ScheduleModule } from '../../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Poll.name, schema: PollSchema }]),
    MongooseModule.forFeature([{ name: MonthlyCalendar.name, schema: MonthlyCalendarSchema }]),
    MongooseModule.forFeature([{ name: OneShotEvent.name, schema: OneShotEventSchema } as any]),
    forwardRef(() => ScheduleModule),
  ],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}

