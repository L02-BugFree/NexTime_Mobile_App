import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsMongoId } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Team Alpha' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Core backend team' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: [] })
  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  members?: string[];
}
