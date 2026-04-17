import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskDto } from './task.dto';

export class CreateTaskChecklistDto {
  @ApiProperty({ example: 'Project Tasks' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ type: [TaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  tasks!: TaskDto[];
}
