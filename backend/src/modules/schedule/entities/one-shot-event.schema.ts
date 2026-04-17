import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event, EventType } from './event.schema';

@Schema()
export class OneShotEvent extends Event {
  @Prop({ required: true })
  specificDate!: Date;
}

export const OneShotEventSchema = SchemaFactory.createForClass(OneShotEvent);
