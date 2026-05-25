import { IsArray, IsString, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

class TaskItemDto {
  @IsString()
  taskName!: string;

  @IsArray()
  assignees!: string[];
}

export class TaskChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskItemDto)
  tasks!: TaskItemDto[];
}
