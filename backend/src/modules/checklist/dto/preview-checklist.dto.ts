import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PreviewChecklistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  prompt!: string;
}
