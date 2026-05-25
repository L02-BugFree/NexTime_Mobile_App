import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomType } from '../rooms/entities/room.schema';

@Injectable()
export class AIService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async assistant(userId: string, roomId: string, prompt: string): Promise<any> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    // Basic access: reuse owner logic (rooms are owned)
    if (room.ownerId.toString() !== userId) {
      throw new ForbiddenException('No access to room');
    }

    if (room.type === RoomType.SELF) {
      return {
        type: 'personal_schedule_query_mock',
        prompt,
        result: {
          upcomingEvents: [],
          suggestedChecklist: {
            title: 'Upcoming Week Checklist',
            tasks: [
              { taskName: 'Review upcoming events', assignees: [userId], status: 'Undone' },
              { taskName: 'Plan focus blocks', assignees: [userId], status: 'Undone' },
            ],
          },
        },
      };
    }

    // GROUP or DIRECT
    return {
      type: 'group_checklist_mock',
      prompt,
      result: {
        title: 'Generated Checklist',
        tasks: [
          { taskName: 'Confirm time slots', assignees: [userId], status: 'Undone' },
          { taskName: 'Share agenda', assignees: [userId], status: 'Undone' },
        ],
      },
    };
  }
}

