import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePrivacyDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  showBirthday?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActiveStatus?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  anonymousOnGroupCalendar?: boolean;
}
