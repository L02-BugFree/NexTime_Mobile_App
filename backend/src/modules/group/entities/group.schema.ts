import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Group extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  members!: Types.ObjectId[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
