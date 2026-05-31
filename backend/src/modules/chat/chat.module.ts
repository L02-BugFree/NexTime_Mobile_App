// chat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message, MessageSchema } from '../rooms/entities/message.schema';
import { Room, RoomSchema } from '../rooms/entities/room.schema';
import { Group, GroupSchema } from '../group/entities/group.schema';
import { ScheduleModule } from '../schedule/schedule.module'; // Import ScheduleModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secretKey',
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => ScheduleModule), // Use forwardRef to avoid circular dependency
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
