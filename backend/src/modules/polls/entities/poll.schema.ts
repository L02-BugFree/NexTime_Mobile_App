import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoteValue = 'YES' | 'NO';

@Schema({ _id: false })
export class PollOption {
  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ required: true, enum: ['YES', 'NO'] })
  // kept for validation convenience, not used directly
  placeholder!: VoteValue;
}

@Schema({ timestamps: true })
export class PollVote extends Document {
  @Prop({ type: Number, required: true })
  optionIndex!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ['YES', 'NO'], required: true })
  value!: VoteValue;
}

@Schema({ timestamps: true })
export class Poll extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members!: Types.ObjectId[];

  @Prop({ type: [{
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  }], default: [] })
  options!: Array<{ startTime: string; endTime: string }>;

  @Prop({ type: [{
    optionIndex: { type: Number, required: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    value: { type: String, enum: ['YES', 'NO'], required: true },
  }], default: [] })
  votes!: Array<{ optionIndex: number; userId: Types.ObjectId; value: VoteValue }>;
}

export const PollSchema = SchemaFactory.createForClass(Poll);

