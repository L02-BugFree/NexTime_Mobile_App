import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Firebase Google ID Token string fetched from mobile client',
    example: 'eyJhbGciOi...',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
