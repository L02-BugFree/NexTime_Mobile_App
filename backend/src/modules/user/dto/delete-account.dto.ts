import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ example: 'confirm-delete-my-account', required: false })
  @IsString()
  @IsOptional()
  confirmationText?: string;
}
