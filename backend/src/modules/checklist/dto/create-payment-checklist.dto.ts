import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DebtorDto } from './debtor.dto';

export class CreatePaymentChecklistDto {
  @ApiProperty({ example: 'Dinner Split' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  payee!: string;

  @ApiProperty({ type: [DebtorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebtorDto)
  debtors: DebtorDto[];
}
