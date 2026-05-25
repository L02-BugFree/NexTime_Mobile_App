import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RoomType {
  SELF = 'SELF',
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

@Schema({ timestamps: true })
export class Room extends Document {
  @Prop({ type: String, enum: RoomType, required: true })
  type!: RoomType;

  // For DIRECT rooms (1-1)
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userA?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userB?: Types.ObjectId;

  // For GROUP rooms
  @Prop({ type: Types.ObjectId, ref: 'Group', required: false })
  groupId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
