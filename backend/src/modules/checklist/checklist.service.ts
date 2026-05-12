import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checklist } from './entities/checklist.schema';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(Checklist.name)
    private checklistModel: Model<Checklist>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async preview(prompt: string) {
    const lowerPrompt = prompt.toLowerCase();

    // Sửa thành chữ thường để đồng bộ với enum
    let type = 'task';

    if (
      lowerPrompt.includes('pay') ||
      lowerPrompt.includes('split') ||
      lowerPrompt.includes('money')
    ) {
      type = 'payment';
    }

    if (lowerPrompt.includes('vote') || lowerPrompt.includes('poll')) {
      type = 'poll';
    }

    return {
      type,
      parsedData: [],
    };
  }

  async confirm(dto: any, userId: string) {
    // Sửa type so sánh thành chữ thường
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.type === 'task' && !dto.tasks) {
      throw new BadRequestException('tasks is required for task checklist');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.type === 'payment' && !dto.debtors) {
      throw new BadRequestException(
        'debtors is required for payment checklist',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.type === 'poll' && !dto.options) {
      throw new BadRequestException('options is required for poll checklist');
    }

    // Lưu vào database
    const newChecklist = new this.checklistModel({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      type: dto.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      title: dto.title || `${dto.type} checklist`,
      creatorId: userId,
      // Lưu thêm data tùy theo type
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      ...(dto.type === 'task' && { tasks: dto.tasks }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      ...(dto.type === 'payment' && { debtors: dto.debtors }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      ...(dto.type === 'poll' && { options: dto.options }),
    });

    const savedChecklist = await newChecklist.save();

    return {
      success: true,
      data: savedChecklist,
    };
  }

  async findAll() {
    return this.checklistModel.find().exec();
  }
}
