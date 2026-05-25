import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum ChecklistType {
  PAYMENT = 'payment',
  TASK = 'task',
  POLL = 'poll',
}

@Schema({ timestamps: true })
export class Checklist {
  @Prop({ required: true, enum: ['task', 'payment', 'poll'] })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  creatorId!: string;

  // task
  @Prop({
    type: [{ taskName: String, assignees: [String] }],
    default: undefined,
  })
  tasks?: { taskName: string; assignees: string[] }[];

  // payment
  @Prop({
    type: [{ name: String, amount: Number }],
    default: undefined,
  })
  debtors?: { name: string; amount: number }[];

  // poll
  @Prop({
    type: [String],
    default: undefined,
  })
  options?: string[];
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);
