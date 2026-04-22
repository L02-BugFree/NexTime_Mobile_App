import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.schema';

@Schema()
export class OneShotEvent extends Event {
  @Prop({ required: true })
  date!: Date;
}

export const OneShotEventSchema = SchemaFactory.createForClass(OneShotEvent);
