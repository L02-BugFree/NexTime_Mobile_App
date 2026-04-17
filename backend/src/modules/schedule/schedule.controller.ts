import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateWeeklyEventDto } from './dto/create-weekly-event.dto';
import { CreateOneShotEventDto } from './dto/create-one-shot-event.dto';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('weekly')
  @ApiOperation({ summary: 'Create weekly recurring event' })
  @ApiResponse({ status: 201, description: 'Event created.' })
  createWeekly(@Body(ValidationPipe) createWeeklyEventDto: CreateWeeklyEventDto) {
    return this.scheduleService.create({ ...createWeeklyEventDto, type: 'weekly' });
  }

  @Post('oneshot')
  @ApiOperation({ summary: 'Create one-shot event' })
  createOneShot(@Body(ValidationPipe) createOneShotEventDto: CreateOneShotEventDto) {
    return this.scheduleService.create({ ...createOneShotEventDto, type: 'oneshot' });
  }

  @Get()
  @ApiOperation({ summary: 'Get all events (filter by group optional)' })
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Get('heatmap/:groupId')
  @ApiOperation({ summary: 'Get group heatmap overlay' })
  getHeatmap(@Param('groupId') groupId: string) {
    return this.scheduleService.getHeatmap(groupId, new Date(), new Date());
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.scheduleService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
