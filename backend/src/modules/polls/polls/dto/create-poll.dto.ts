import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PollOptionDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}

export class CreatePollDto {
  @ApiProperty({ example: '662f7a2f9c2e4c0012abcd38' })
  @IsMongoId()
  roomId!: string;

  @ApiPropertyOptional({ type: [String], example: ['662f7a2f9c2e4c0012abcd39'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  members?: string[];

  @ApiProperty({ type: [PollOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options!: PollOptionDto[];
}

