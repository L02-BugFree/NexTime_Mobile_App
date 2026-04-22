import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotResponse {
  @ApiProperty()
  busyCount!: number;

  @ApiProperty({ type: 'string', isArray: true })
  avatars!: string[];

  @ApiProperty()
  isConflict!: boolean;
}

export class HeatmapResponse {
  @ApiProperty()
  groupId!: string;

  @ApiProperty({ type: TimeSlotResponse, isArray: true })
  slots!: TimeSlotResponse[];
}

