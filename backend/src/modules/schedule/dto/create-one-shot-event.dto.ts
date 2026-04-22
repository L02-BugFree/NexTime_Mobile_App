import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsHexColor, IsNumber } from 'class-validator';

export class CreateOneShotEventDto {
  @ApiProperty({ example: 'Doctor Appointment' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Regular checkup' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-04-27T09:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2024-04-27T10:00:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: '#33FF57' })
  @IsString()
  @IsHexColor()
  colorHex!: string;

  @ApiProperty({ example: 'health' })
  @IsString()
  tag!: string;

  @ApiProperty({ example: 15, description: 'Minutes before to remind' })
  @IsOptional()
  @IsNumber()
  remindBefore?: number;
}
