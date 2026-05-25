import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class TimeSlot extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  startTime: string; // ISO "2024-04-15T09:00:00"

  @Prop({ required: true })
  endTime: string;

  @Prop({ enum: ['weekly', 'oneshot'] })
  type: string;

  @Prop()
  originalEventId?: Types.ObjectId;
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

