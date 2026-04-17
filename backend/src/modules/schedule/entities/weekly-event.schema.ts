import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event, EventType } from './event.schema';

@Schema()
export class WeeklyEvent extends Event {
  @Prop({ required: true })
  dayOfWeek!: number;
}

export const WeeklyEventSchema = SchemaFactory.createForClass(WeeklyEvent);
