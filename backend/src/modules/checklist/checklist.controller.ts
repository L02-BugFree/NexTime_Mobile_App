import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { PreviewChecklistDto } from './dto/preview-checklist.dto';
import { ConfirmChecklistDto } from './dto/confirm-checklist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('checklists')
@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview a checklist based on the provided prompt' })
  @ApiResponse({ status: 200, description: 'Checklist preview generated successfully' })
  async preview(@Body() dto: PreviewChecklistDto) {
    return this.checklistService.preview(dto.prompt);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm and create a checklist' })
  @ApiResponse({ status: 201, description: 'Checklist created successfully' })
  @ApiBearerAuth()
  async confirm(@Body() dto: ConfirmChecklistDto, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user?.userId;
    return this.checklistService.confirm(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all checklists' })
  @ApiResponse({ status: 200, description: 'Checklists retrieved successfully' })
  @ApiBearerAuth()
  async getAll(@Req() req) {
    const userId = req.user?.userId;
    return this.checklistService.findAllForUser(userId);
  }
}
