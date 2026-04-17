import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Checklist, ChecklistType } from './checklist.schema';
import { Types } from 'mongoose';

@Schema()
export class PaymentChecklist extends Checklist {
  @Prop({ enum: ChecklistType.PAYMENT })
  type: ChecklistType.PAYMENT = ChecklistType.PAYMENT;

  @Prop({ required: true })
  payee!: string;

  @Prop({ type: [{
    user: { type: Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  }] })
  debtors!: Array<{
    user: Types.ObjectId;
    amount: number;
    status: string;
  }>;
}

export const PaymentChecklistSchema = SchemaFactory.createForClass(PaymentChecklist);
