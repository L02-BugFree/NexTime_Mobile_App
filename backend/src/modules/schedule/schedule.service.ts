import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './entities/event.schema';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: any) {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(groupId?: string) {
    return this.eventModel.find(groupId ? { groupId } : {}).exec();
  }

  async getHeatmap(groupId: string, startDate: Date, endDate: Date) {
    // Aggregate busy count per time slot for group
    const events = await this.eventModel.find({ groupId }).exec();
    // Mock heatmap logic: group by time slots, count overlapping users (assume per user)
    const heatmap = []; 
    // Impl logic to overlay schedules
    return { groupId, startDate, endDate, busySlots: [] }; // placeholder
  }

  async findOne(id: string) {
    return this.eventModel.findById(id).exec();
  }

  async update(id: string, updateEventDto: any) {
    return this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }
}
