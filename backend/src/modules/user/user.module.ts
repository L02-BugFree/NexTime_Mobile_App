import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Group, GroupSchema } from '../group/entities/group.schema';
import { MonthlyCalendar, MonthlyCalendarSchema } from '../schedule/entities/monthly-calendar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: MonthlyCalendar.name, schema: MonthlyCalendarSchema }]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

