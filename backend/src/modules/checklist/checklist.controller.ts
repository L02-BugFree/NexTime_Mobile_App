import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ChecklistService } from './checklist.service';
import { PreviewChecklistDto } from './dto/preview-checklist.dto';

@ApiTags('checklist')
@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post('preview')
  @ApiOperation({ summary: 'AI preview checklist from text prompt' })
  @ApiBody({ description: 'Raw text prompt' })
  preview(@Body('prompt') prompt: string) {
    return this.checklistService.preview(prompt);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm and save previewed checklist' })
  confirm(@Body() createChecklistDto: any) {
    return this.checklistService.confirm(createChecklistDto);
  }

  @Get()
  findAll() {
    return this.checklistService.findAll();
  }
}
