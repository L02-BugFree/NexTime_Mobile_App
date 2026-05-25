import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty()
  _id!: string;
  
  @ApiProperty()
  title!: string;
  
  @ApiProperty({ required: false })
  description?: string;
  
  @ApiProperty()
  startTime!: string;
  
  @ApiProperty()
  endTime!: string;
  
  @ApiProperty()
  colorHex!: string;
  
  @ApiProperty()
  tag!: string;
  
  @ApiProperty()
  type!: string;
  
  @ApiProperty({ required: false })
  dayOfWeek?: number;
  
  @ApiProperty()
  userId!: string;
  
  @ApiProperty({ required: false })
  groupId?: string;
  
  @ApiProperty()
  createdAt!: Date;
  
  @ApiProperty()
  updatedAt!: Date;
}
