import { Controller, Post, Body, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

@Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  getMe() {
    // TODO: Implement with @Req() req: Request, return req.user
    return { message: 'Authenticated user profile' };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth()
  updateProfile(@Body() updateDto: any) {
    // impl
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user settings (theme, privacy)' })
  @ApiBearerAuth()
  updateSettings(@Body() settingsDto: any) {
    // impl
  }

  @Get('qr')
  @ApiOperation({ summary: 'Get friendCode for QR' })
  @ApiBearerAuth()
  getQrCode() {
    // Return { friendCode: 'JD123456' }
  }
}

