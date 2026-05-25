import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Language, Theme, Gender } from '../entities/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
email!: string;

  @ApiProperty({ example: 'password123', description: 'Min 6 chars' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'JD123456' })
  @IsString()
  @IsNotEmpty()
  friendCode: string;

  @ApiProperty({ enum: Language, default: Language.EN })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @ApiProperty({ enum: Theme, default: Theme.DARK })
  @IsEnum(Theme)
  @IsOptional()
  theme?: Theme;

  @ApiProperty()
  @IsOptional()
  birthdate?: Date;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}

