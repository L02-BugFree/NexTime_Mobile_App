import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsMongoId, Min } from 'class-validator';

export class VoteDto {
  @ApiProperty({ example: 0, description: 'Index of the poll option' })
  @IsInt()
  @Min(0)
  optionIndex!: number;

  @ApiProperty({ enum: ['YES', 'NO'], example: 'YES' })
  @IsIn(['YES', 'NO'])
  value!: 'YES' | 'NO';
}

