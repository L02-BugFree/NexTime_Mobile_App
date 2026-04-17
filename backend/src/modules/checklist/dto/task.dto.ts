import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

export enum TaskStatus {
  DONE = 'done',
  UNDONE = 'undone',
}

export class TaskDto {
  @ApiProperty({ example: 'Finish design' })
  @IsString()
  taskName!: string;

  @ApiProperty({ example: ['alice', 'bob'] })
  @IsArray()
  @IsString({ each: true })
  assignees!: string[];

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.UNDONE })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
