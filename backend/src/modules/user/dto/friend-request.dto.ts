import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class FriendRequestDto {
  @ApiProperty({ example: '662f7a2f9c2e4c0012abcd34' })
  @IsMongoId()
  targetUserId!: string;
}

