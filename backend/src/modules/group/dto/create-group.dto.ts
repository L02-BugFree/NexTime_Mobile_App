import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Team Alpha' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: [] })
  @IsArray()
  @IsOptional()
  members?: string[];
}
