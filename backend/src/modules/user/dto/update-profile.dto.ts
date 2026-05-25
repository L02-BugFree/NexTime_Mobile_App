import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Theme, Gender, Language } from '../entities/user.schema';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ example: 'https://new-avatar.com/img.jpg', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'Software Engineer, loves coffee', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ enum: Gender, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @ApiProperty({ enum: Theme, required: false })
  @IsEnum(Theme)
  @IsOptional()
  theme?: Theme;

  @ApiProperty({ enum: Language, required: false })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}
