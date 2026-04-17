import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GroupService } from './group.service';

@ApiTags('group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create group' })
  create(@Body() createGroupDto: any) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get('heatmap/:id')
  @ApiOperation({ summary: 'Get group heatmap' })
  getHeatmap(@Param('id') id: string) {
    return this.groupService.getHeatmap(id);
  }
}
