import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

class DebtorDto {
  @IsString()
  user!: string;

  @IsNumber()
  amount!: number;
}

export class PaymentChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebtorDto)
  debtors!: DebtorDto[];
}
