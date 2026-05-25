import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomType } from '../rooms/entities/room.schema';

@Injectable()
export class AIService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async assistant(
    userId: string,
    roomId: string,
    prompt: string,
  ): Promise<any> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    // Access check theo từng room type:
    // SELF  → owner only
    // DIRECT → userA hoặc userB
    // GROUP  → owner only (rooms store ownerId for GROUP rooms)
    const isOwner = room.ownerId.toString() === userId;
    const isDirectParticipant =
      room.userA?.toString() === userId || room.userB?.toString() === userId;

    if (room.type === RoomType.SELF && !isOwner) {
      throw new ForbiddenException('No access to room');
    }

    if (room.type === RoomType.DIRECT && !isDirectParticipant) {
      throw new ForbiddenException('No access to room');
    }

    if (room.type === RoomType.GROUP && !isOwner) {
      throw new ForbiddenException('No access to room');
    }

    // Stub-free deterministic suggestions driven by room context + prompt keywords.
    const lower = (prompt ?? '').toLowerCase();

    const common = {
      assumptions: [
        'No external LLM calls are used; suggestions are deterministic from room type and prompt keywords.',
      ],
    };

    if (room.type === RoomType.SELF) {
      return {
        type: 'personal_schedule_query',
        prompt,
        ...common,
        suggestions: [
          {
            checklistTitle: 'Upcoming Week Checklist',
            tasks: [
              {
                taskName: 'Review upcoming events',
                assignees: [userId],
                status: 'Undone',
              },
              {
                taskName: lower.includes('goal')
                  ? 'Define 1-3 measurable personal goals'
                  : 'Plan focus blocks',
                assignees: [userId],
                status: 'Undone',
              },
              {
                taskName: lower.includes('plan')
                  ? 'Draft next-actions list'
                  : 'Set personal priorities',
                assignees: [userId],
                status: 'Undone',
              },
            ],
          },
        ],
      };
    }

    if (room.type === RoomType.DIRECT) {
      return {
        type: 'direct_schedule_query',
        prompt,
        ...common,
        suggestions: [
          {
            checklistTitle: 'Direct Meeting Checklist',
            participants: [room.userA?.toString(), room.userB?.toString()],
            tasks: [
              {
                taskName: lower.includes('agenda')
                  ? 'Finalize agenda topics'
                  : 'Find overlapping free slots',
                assignees: [userId],
                status: 'Undone',
              },
              {
                taskName: 'Confirm meeting time',
                assignees: [userId],
                status: 'Undone',
              },
              {
                taskName: lower.includes('prep')
                  ? 'Prepare meeting materials'
                  : 'Prepare agenda',
                assignees: [userId],
                status: 'Undone',
              },
            ],
          },
        ],
      };
    }

    return {
      type: 'group_checklist',
      prompt,
      ...common,
      suggestions: [
        {
          checklistTitle: 'Group Meeting Checklist',
          groupId: room.groupId?.toString(),
          tasks: [
            {
              taskName: 'Confirm time slots for all members',
              assignees: [userId],
              status: 'Undone',
            },
            {
              taskName: 'Share agenda with group',
              assignees: [userId],
              status: 'Undone',
            },
            {
              taskName: 'Assign roles/responsibilities',
              assignees: [userId],
              status: 'Undone',
            },
            {
              taskName: 'Send meeting invite',
              assignees: [userId],
              status: 'Undone',
            },
          ],
        },
      ],
    };
  }
}

// NOTE: AI assistant logic is outside the heatmap/pipeline audit scope.


