import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { PreviewChecklistDto } from './dto/preview-checklist.dto';
import { ConfirmChecklistDto } from './dto/confirm-checklist.dto';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post('preview')
  async preview(@Body() dto: PreviewChecklistDto) {
    return this.checklistService.preview(dto.prompt);
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmChecklistDto, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user?.userId || 'test-user-123';
    return this.checklistService.confirm(dto, userId);
  }

  @Get()
  async getAll() {
    return this.checklistService.findAll();
  }
}
