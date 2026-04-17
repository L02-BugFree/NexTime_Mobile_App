import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checklist } from './entities/checklist.schema';

@Injectable()
export class ChecklistService {
  constructor(@InjectModel(Checklist.name) private checklistModel: Model<Checklist>) {}

  async preview(prompt: string): Promise<any> {
    // Mock AI parsing
    const lower = prompt.toLowerCase();
    if (lower.includes('pay') || lower.includes('split')) {
      // Mock payment
      return {
        type: 'payment',
        title: 'Payment Split',
        payee: 'You',
        debtors: [{ user: 'friend', amount: 20, status: 'unpaid' }],
        rawPrompt: prompt,
      };
    } else if (lower.includes('task') || lower.includes('todo')) {
      return {
        type: 'task',
        title: 'Tasks',
        tasks: [{ taskName: 'Do something', assignees: [], status: 'undone' }],
        rawPrompt: prompt,
      };
    } else {
      return {
        type: 'poll',
        title: 'Poll',
        options: ['Yes', 'No'],
        rawPrompt: prompt,
      };
    }
  }

  async confirm(createChecklistDto: any) {
    const created = new this.checklistModel(createChecklistDto);
    return created.save();
  }

  async findAll() {
    return this.checklistModel.find().exec();
  }
}
