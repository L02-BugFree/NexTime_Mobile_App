import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ChecklistType {
  PAYMENT = 'payment',
  TASK = 'task',
  POLL = 'poll',
}

@Schema({ discriminatorKey: 'type' })
export class Checklist extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  userId!: Types.ObjectId;

  @Prop()
  groupId?: Types.ObjectId;
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);
