import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hey! Are you joining the schedule overlay?' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

