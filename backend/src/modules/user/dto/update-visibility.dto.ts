import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum VisibilitySetting {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  CONTACTS = 'contacts',
}

export class UpdateVisibilityDto {
  @ApiProperty({ enum: VisibilitySetting, example: VisibilitySetting.EVERYONE, required: false })
  @IsEnum(VisibilitySetting)
  @IsOptional()
  visibilitySetting?: VisibilitySetting;
}

