import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { PollsService } from './polls.service';

@ApiTags('polls')
@Controller()
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('polls')
  @ApiOperation({ summary: 'Create a poll' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201 })
  async create(@Req() req: any, @Body() dto: CreatePollDto) {
    return this.pollsService.createPoll(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('polls/:pollId/vote')
  @ApiOperation({ summary: 'Vote YES/NO on a time option' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async vote(
    @Req() req: any,
    @Param('pollId') pollId: string,
    @Body() dto: VoteDto,
  ) {
    return this.pollsService.voteAndAutoSchedule(req.user.userId, pollId, dto);
  }
}
