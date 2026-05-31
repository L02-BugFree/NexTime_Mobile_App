// rooms.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room, RoomSchema } from './entities/room.schema';
import { Message, MessageSchema } from './entities/message.schema';
import { Group, GroupSchema } from '../group/entities/group.schema';
import { User, UserSchema } from '../user/entities/user.schema';
import { HeatmapModule } from '../heatmap/heatmap.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
    HeatmapModule, // Import HeatmapModule
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
