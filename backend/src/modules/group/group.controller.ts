import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create group' })
  @ApiBearerAuth()
  create(@Req() req: AuthenticatedRequest, @Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(req.user.userId, createGroupDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.groupService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('heatmap/:id')
  @ApiOperation({ summary: 'Get group heatmap' })
  @ApiBearerAuth()
  getHeatmap(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('month') month?: string) {
    return this.groupService.getHeatmap(req.user.userId, id, month);
  }
}
