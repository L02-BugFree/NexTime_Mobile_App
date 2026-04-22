import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';



@Schema({ 
  timestamps: true, 
  discriminatorKey: 'type',
  collection: 'events'
})
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

  @Prop({ type: Types.ObjectId })
  groupId?: Types.ObjectId;

  @Prop({ default: 15 })
  remindBefore!: number;
}

export const EventSchema = SchemaFactory.createForClass(Event);
