import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { Checklist, ChecklistSchema } from './entities/checklist.schema';
import { PaymentChecklist, PaymentChecklistSchema } from './entities/payment-checklist.schema';
// Add other schemas

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checklist.name, schema: ChecklistSchema },
      { name: PaymentChecklist.name, schema: PaymentChecklistSchema },
      // TaskChecklist, PollChecklist
    ]),
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
