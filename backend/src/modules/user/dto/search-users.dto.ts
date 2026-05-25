import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsString()
  query?: string;
}
