import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOneshotDto } from './create-oneshot.dto';

export class UpdateEventDto extends PartialType(CreateOneshotDto) {}
