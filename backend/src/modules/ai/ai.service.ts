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

    // Access check theo từng room type:
    // SELF  → chỉ owner
    // DIRECT → userA hoặc userB
    // GROUP  → owner (ownerId) — members nằm ở Group collection, không phải Room
    const isOwner = room.ownerId.toString() === userId;
    const isDirectParticipant =
      room.userA?.toString() === userId || room.userB?.toString() === userId;

    if (!isOwner && !isDirectParticipant) {
      throw new ForbiddenException('No access to room');
    }

    if (room.type === RoomType.SELF) {
      return {
        type: 'personal_schedule_query',
        prompt,
        result: {
          upcomingEvents: [],
          suggestedChecklist: {
            title: 'Upcoming Week Checklist',
            tasks: [
              { taskName: 'Review upcoming events', assignees: [userId], status: 'Undone' },
              { taskName: 'Plan focus blocks', assignees: [userId], status: 'Undone' },
              { taskName: 'Set personal goals', assignees: [userId], status: 'Undone' },
            ],
          },
        },
      };
    }

    if (room.type === RoomType.DIRECT) {
      return {
        type: 'direct_schedule_query',
        prompt,
        result: {
          title: 'Direct Meeting Checklist',
          participants: [room.userA?.toString(), room.userB?.toString()],
          tasks: [
            { taskName: 'Find overlapping free slots', assignees: [userId], status: 'Undone' },
            { taskName: 'Confirm meeting time', assignees: [userId], status: 'Undone' },
            { taskName: 'Prepare agenda', assignees: [userId], status: 'Undone' },
          ],
        },
      };
    }

    // GROUP — members nằm ở Group collection (groupId), không query ở đây
    return {
      type: 'group_checklist',
      prompt,
      result: {
        title: 'Group Meeting Checklist',
        groupId: room.groupId?.toString(),
        tasks: [
          { taskName: 'Confirm time slots for all members', assignees: [userId], status: 'Undone' },
          { taskName: 'Share agenda with group', assignees: [userId], status: 'Undone' },
          { taskName: 'Assign roles/responsibilities', assignees: [userId], status: 'Undone' },
          { taskName: 'Send meeting invite', assignees: [userId], status: 'Undone' },
        ],
      },
    };
  }
}