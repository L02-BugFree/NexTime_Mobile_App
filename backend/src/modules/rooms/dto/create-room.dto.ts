import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { RoomType } from '../entities/room.schema';

export class CreateRoomDto {
  @ApiProperty({ enum: RoomType, example: RoomType.DIRECT })
  @IsEnum(RoomType)
  type!: RoomType;

  @ApiProperty({ required: false, example: '662f7a2f9c2e4c0012abcd34' })
  @IsOptional()
  @IsMongoId()
  userA?: string;

  @ApiProperty({ required: false, example: '662f7a2f9c2e4c0012abcd35' })
  @IsOptional()
  @IsMongoId()
  userB?: string;

  @ApiProperty({ required: false, example: '662f7a2f9c2e4c0012abcd36' })
  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @ApiProperty({ example: '662f7a2f9c2e4c0012abcd37' })
  @IsString()
  // ownerId is taken from req.user.userId in controller; this DTO only validates if client sends it.
  ownerId!: string;
}

