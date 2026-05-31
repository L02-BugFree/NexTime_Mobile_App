import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Event, EventSchema } from './entities/event.schema';
import { WeeklyEventSchema } from './entities/weekly-event.schema';
import { OneShotEventSchema } from './entities/one-shot-event.schema';
import {
  MonthlyCalendar,
  MonthlyCalendarSchema,
} from './entities/monthly-calendar.schema';
import { ChatModule } from '../chat/chat.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: 'weekly', schema: WeeklyEventSchema },
          { name: 'oneshot', schema: OneShotEventSchema },
        ],
      },
      {
        name: MonthlyCalendar.name,
        schema: MonthlyCalendarSchema,
      },
    ]),
    forwardRef(() => ChatModule),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
