import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsHexColor, IsNumber } from 'class-validator';

export class CreateWeeklyEventDto {
  @ApiProperty({ example: 'Team Meeting' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Weekly standup discussion' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  endTime!: string;

  @ApiProperty({ example: 1, description: '1=Monday,7=Sunday' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ example: '#FF5733' })
  @IsString()
  @IsHexColor()
  colorHex!: string;

  @ApiProperty({ example: 'work' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ example: 15, description: 'Minutes before to remind' })
  @IsOptional()
  @IsNumber()
  remindBefore?: number;
}
