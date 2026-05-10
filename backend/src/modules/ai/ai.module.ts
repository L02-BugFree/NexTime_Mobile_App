import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from '../rooms/entities/room.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }])],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}

