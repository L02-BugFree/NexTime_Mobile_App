import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class ShareEventDto {
  @ApiProperty({ example: ['roomId1', 'roomId2'] })
  @IsArray()
  @IsMongoId({ each: true })
  roomIds!: string[];
}
