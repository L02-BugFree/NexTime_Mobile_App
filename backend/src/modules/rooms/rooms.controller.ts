import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a room' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201 })
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List all rooms for the user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async list(@Req() req: AuthenticatedRequest) {
    return this.roomsService.listRoomsForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':roomId/messages')
  @ApiOperation({ summary: 'Fetch messages with pagination' })
  @ApiBearerAuth()
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.roomsService.getMessages(req.user.userId, roomId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomId/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiBearerAuth()
  async sendMessage(@Req() req: AuthenticatedRequest, @Param('roomId') roomId: string, @Body() dto: CreateMessageDto) {
    return this.roomsService.sendMessage(req.user.userId, roomId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':roomId/heatmap')
  @ApiOperation({ summary: 'Get room heatmap overlay (busy counts)' })
  @ApiBearerAuth()
  async getHeatmap(@Req() req: AuthenticatedRequest, @Param('roomId') roomId: string, @Query('month') month?: string) {
    return this.roomsService.getHeatmap(req.user.userId, roomId, month);
  }
}


