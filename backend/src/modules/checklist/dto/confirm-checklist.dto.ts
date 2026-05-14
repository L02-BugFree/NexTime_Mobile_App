import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ChecklistType {
  PAYMENT = 'payment',
  TASK = 'task',
  POLL = 'poll',
}

class TaskItemDto {
  @IsString()
  taskName!: string;

  @IsArray()
  @IsString({ each: true })
  assignees!: string[];
}

export class ConfirmChecklistDto {
  @IsEnum(ChecklistType)
  type!: ChecklistType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskItemDto)
  tasks?: TaskItemDto[];

  @IsOptional()
  @IsArray()
  debtors?: any[];

  @IsOptional()
  @IsArray()
  options?: string[];
}
