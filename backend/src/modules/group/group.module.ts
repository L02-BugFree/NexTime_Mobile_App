import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group, GroupSchema } from './entities/group.schema';
import {
  MonthlyCalendar,
  MonthlyCalendarSchema,
} from '../schedule/entities/monthly-calendar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    MongooseModule.forFeature([
      { name: MonthlyCalendar.name, schema: MonthlyCalendarSchema },
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
