import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Event, EventSchema } from './entities/event.schema';
import { WeeklyEvent, WeeklyEventSchema } from './entities/weekly-event.schema';
import { OneShotEvent, OneShotEventSchema } from './entities/one-shot-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: WeeklyEvent.name, schema: WeeklyEventSchema },
          { name: OneShotEvent.name, schema: OneShotEventSchema },
        ],
      },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
