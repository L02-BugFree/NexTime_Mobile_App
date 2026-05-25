import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Req,
  Query,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateWeeklyEventDto } from './dto/create-weekly-event.dto';
import { CreateOneShotEventDto } from './dto/create-one-shot-event.dto';
import { CreateOneshotDto } from './dto/create-oneshot.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './entities/event-response.dto';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @UseGuards(JwtAuthGuard)
  @Post('weekly')
  @ApiOperation({
    summary: 'Create weekly recurring event (populates MonthlyCalendar)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created.' })
  async createWeekly(
    @Req() req: any,
    @Body(ValidationPipe) createWeeklyEventDto: CreateWeeklyEventDto,
  ) {
    const groupId = req.user?.groupId || null;
    const event = await this.scheduleService.createWeekly(
      { ...createWeeklyEventDto, groupId },
      req.user.userId,
    );
    return event.toObject({ versionKey: false });
  }

  @UseGuards(JwtAuthGuard)
  @Post('oneshot')
  @ApiOperation({ summary: 'Create one-shot event (YYYY-MM-DD format)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created' })
  async createOneshot(
    @Req() req: any,
    @Body(ValidationPipe) dto: CreateOneshotDto,
  ) {
    return this.scheduleService.createOneshot(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('monthly')
  @ApiOperation({
    summary:
      'Get monthly calendar. Param ?month=YYYY-MM. Empty array if no data.',
  })
  @ApiBearerAuth()
  async getMonthly(@Req() req: any, @Query('month') month?: string) {
    return this.scheduleService.getMonthly(req.user.userId, month);
  }

  @UseGuards(JwtAuthGuard)
  @Get('heatmap/:groupId')
  @ApiOperation({ summary: 'Get group heatmap overlay' })
  @ApiBearerAuth()
  getHeatmap(@Req() req: any, @Param('groupId') groupId: string) {
    return this.scheduleService.getHeatmap(groupId, new Date(), new Date());
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':eventId')
  @ApiOperation({
    summary:
      'Update event - pulls old slot, pushes new slot to MonthlyCalendar',
  })
  @ApiBearerAuth()
  async update(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.scheduleService.update(req.user.userId, eventId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':eventId')
  @ApiOperation({ summary: 'Delete event - pulls slots from MonthlyCalendar' })
  @ApiBearerAuth()
  async delete(@Req() req: any, @Param('eventId') eventId: string) {
    return this.scheduleService.delete(req.user.userId, eventId);
  }
}
