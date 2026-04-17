import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum } from 'class-validator';

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

export class DebtorDto {
  @ApiProperty({ example: 'Alice' })
  @IsString()
  user!: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.UNPAID })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}
