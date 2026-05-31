// rooms.service.ts - Complete version
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from '../group/entities/group.schema';
import { User } from '../user/entities/user.schema';
import { HeatmapService } from '../heatmap/heatmap.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(User.name) private userModel: Model<User>,
    private heatmapService: HeatmapService,
  ) {}

  // ✅ Create a new group
  async create(userId: string, createGroupDto: CreateGroupDto) {
    const memberIds = new Set<string>([
      ...(createGroupDto.members ?? []),
      userId,
    ]);
    const createdGroup = new this.groupModel({
      ...createGroupDto,
      members: Array.from(memberIds).map((id) => new Types.ObjectId(id)),
    });
    return createdGroup.save();
  }

  // ✅ Get all groups for a user
  async findAll(userId: string) {
    return this.groupModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('members', '_id displayName email avatarUrl')
      .exec();
  }

  // ✅ Get group by ID
  async findOne(groupId: string) {
    const group = await this.groupModel
      .findById(groupId)
      .populate('members', '_id displayName email avatarUrl')
      .exec();
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  // ✅ Update group
  async update(
    userId: string,
    groupId: string,
    updateData: Partial<CreateGroupDto>,
  ) {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (updateData.name) group.name = updateData.name;
    if (updateData.members) {
      const newMembers = new Set([
        ...group.members.map((id) => id.toString()),
        ...updateData.members,
        userId,
      ]);
      group.members = Array.from(newMembers).map(
        (id) => new Types.ObjectId(id),
      );
    }

    return group.save();
  }

  // ✅ Delete group (only owner can delete)
  async delete(userId: string, groupId: string) {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    // Check if user is the creator (assuming first member is creator)
    const isCreator = group.members[0]?.toString() === userId;
    if (!isCreator) {
      throw new ForbiddenException('Only group creator can delete the group');
    }

    await this.groupModel.findByIdAndDelete(groupId);
    return { message: 'Group deleted successfully' };
  }

  // ✅ Add member to group
  async addMember(userId: string, groupId: string, memberId: string) {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some((id) => id.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (group.members.some((id) => id.toString() === memberId)) {
      throw new BadRequestException('User is already a member');
    }

    group.members.push(new Types.ObjectId(memberId));
    await group.save();

    return group;
  }

  // ✅ Remove member from group
  async removeMember(userId: string, groupId: string, memberId: string) {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    const isAdmin = group.members[0]?.toString() === userId;
    if (!isAdmin) {
      throw new ForbiddenException('Only group admin can remove members');
    }

    group.members = group.members.filter((id) => id.toString() !== memberId);
    await group.save();

    return group;
  }

  // ✅ Get heatmap for group
  async getHeatmap(userId: string, groupId: string, month?: string) {
    const group = await this.groupModel.findById(groupId).lean().exec();
    if (!group) throw new NotFoundException('Group not found');

    const isMember = (group.members ?? []).some(
      (memberId) => memberId.toString() === userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const memberIds = (group.members ?? []).map((id) => id.toString());

    // For groups, all members are visible (no privacy check needed)
    const timeSlots = await this.heatmapService.generateHeatmap(
      memberIds,
      month,
    );

    return {
      groupId,
      month: month ?? new Date().toISOString().slice(0, 7),
      timeSlots,
    };
  }

  // ✅ Remove user from all groups (when user is deleted)
  async removeMemberFromAllGroups(userId: string) {
    await this.groupModel.updateMany(
      { members: new Types.ObjectId(userId) },
      { $pull: { members: new Types.ObjectId(userId) } },
    );
  }
}
