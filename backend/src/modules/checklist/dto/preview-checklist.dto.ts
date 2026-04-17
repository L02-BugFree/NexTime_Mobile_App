import { ApiProperty } from '@nestjs/swagger';

export enum ChecklistType {
  PAYMENT = 'payment',
  TASK = 'task',
  POLL = 'poll',
}

export class PreviewChecklistDto {
  @ApiProperty()
  type: ChecklistType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  data: any; // structured data based on type

  @ApiProperty()
  rawPrompt: string;
}
