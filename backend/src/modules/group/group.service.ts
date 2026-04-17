import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from './entities/group.schema';
import { ScheduleService } from '../schedule/schedule.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    private scheduleService: ScheduleService,
  ) {}

  async create(createGroupDto: any) {
    const createdGroup = new this.groupModel(createGroupDto);
    return createdGroup.save();
  }

  async findAll() {
    return this.groupModel.find().populate('members').exec();
  }

  async getHeatmap(groupId: string) {
    return this.scheduleService.getHeatmap(groupId, new Date(), new Date());
  }
}
