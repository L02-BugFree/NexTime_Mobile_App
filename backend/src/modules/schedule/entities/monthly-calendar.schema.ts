import {
  Prop,
  Schema,
  SchemaFactory,
  Schema as MongooseSchema,
} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class EventInMonth {
  @Prop({ type: String })
  originalEventId!: string | Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  fullDate!: Date;

  @Prop()
  dayOfWeek?: number;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;

  @Prop()
  colorHex!: string;

  @Prop()
  type!: string;
}

@Schema({ timestamps: true })
export class MonthlyCalendar extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  month!: string; // "2024-04"

  @Prop({ type: [EventInMonth], default: [] })
  eventsInMonth!: EventInMonth[];
}

export const MonthlyCalendarSchema =
  SchemaFactory.createForClass(MonthlyCalendar);
