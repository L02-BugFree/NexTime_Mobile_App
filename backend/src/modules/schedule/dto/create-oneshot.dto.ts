import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsHexColor,
  IsEnum,
} from 'class-validator';

export class CreateOneshotDto {
  @ApiProperty({ example: 'Doctor Appointment' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Regular checkup' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-04-27' })
  @IsString()
  date!: string; // YYYY-MM-DD

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  endTime!: string;

  @ApiProperty({ example: '#33FF57' })
  @IsString()
  @IsHexColor()
  colorHex!: string;

  @ApiProperty({ example: 'health' })
  @IsString()
  @IsOptional()
  tag?: string;
}
