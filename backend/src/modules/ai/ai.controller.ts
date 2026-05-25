import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { IsNotEmpty, IsString } from 'class-validator';

class AIAssistantDto {
  @ApiProperty({ example: 'Create a checklist for our next group overlay meeting.' })
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @UseGuards(JwtAuthGuard)
  @Post('assistant/:roomId')
  @ApiOperation({ summary: 'AI contextual assistant' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async assistant(@Req() req: any, @Param('roomId') roomId: string, @Body() dto: AIAssistantDto) {
    return this.aiService.assistant(req.user.userId, roomId, dto.prompt);
  }
}

