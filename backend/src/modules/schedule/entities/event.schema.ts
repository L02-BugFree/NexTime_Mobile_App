import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventType {
  WEEKLY = 'weekly',
  ONESHOT = 'oneshot',
}

@Schema({ discriminatorKey: 'type', timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ required: true })
  colorHex!: string;

  @Prop({ required: true })
  tag!: string;

  @Prop({ required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  groupId?: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
