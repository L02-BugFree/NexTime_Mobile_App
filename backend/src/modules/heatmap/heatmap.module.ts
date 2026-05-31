import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeatmapService } from './heatmap.service';
import {
  MonthlyCalendar,
  MonthlyCalendarSchema,
} from '../schedule/entities/monthly-calendar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonthlyCalendar.name, schema: MonthlyCalendarSchema },
    ]),
  ],
  providers: [HeatmapService],
  exports: [HeatmapService],
})
export class HeatmapModule {}
