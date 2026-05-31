import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOneshotDto } from './create-oneshot.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateOneshotDto) {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  dayOfWeek?: number;

  @ApiProperty({ example: 'weekly', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
