import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsHexColor } from 'class-validator';

export class CreateOneShotEventDto {
  @ApiProperty({ example: 'Doctor Appointment' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Regular checkup' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-12-01T09:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2024-12-01T10:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: '#33FF57' })
  @IsString()
  @IsHexColor()
  colorHex!: string;

  @ApiProperty({ example: 'health' })
  @IsString()
  tag!: string;
}
