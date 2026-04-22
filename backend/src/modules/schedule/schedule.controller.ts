import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateWeeklyEventDto } from './dto/create-weekly-event.dto';
import { CreateOneShotEventDto } from './dto/create-one-shot-event.dto';
import { EventResponseDto } from './entities/event-response.dto';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

@UseGuards(JwtAuthGuard)
@Post('weekly')
  @ApiOperation({ summary: 'Create weekly recurring event (populates MonthlyCalendar)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created.' })
async createWeekly(@Req() req: any, @Body(ValidationPipe) createWeeklyEventDto: CreateWeeklyEventDto) {
    const groupId = req.user?.groupId || null;
    const event = await this.scheduleService.createWeekly({ ...createWeeklyEventDto, groupId }, req.user.userId);
    return event.toObject({ versionKey: false });
  }

  @UseGuards(JwtAuthGuard)
  @Post('oneshot')
  @ApiOperation({ summary: 'Create one-shot event' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created.' })
  async createOneShot(@Req() req: any, @Body(ValidationPipe) createOneShotEventDto: CreateOneShotEventDto) {
    const groupId = req.user?.groupId || null;
    const event = await this.scheduleService.createOneShot({ ...createOneShotEventDto, groupId }, req.user.userId);
    return event.toObject({ versionKey: false });
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
