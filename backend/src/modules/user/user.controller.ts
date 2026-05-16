import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { User } from './entities/user.schema';
import { SearchUsersDto } from './dto/search-users.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendAcceptDto } from './dto/friend-accept.dto';
import { BlockDto } from './dto/block.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  async getMe(@Req() req: AuthenticatedRequest): Promise<User> {
    const user = await this.userService.findById(req.user.userId);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() updateDto: UpdateProfileDto): Promise<User> {
    return this.userService.update(req.user.userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async updatePrivacy(@Req() req: AuthenticatedRequest, @Body() updateDto: UpdatePrivacyDto): Promise<User> {
    const updateData = { privacySettings: updateDto };
    return this.userService.update(req.user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('visibility')
  @ApiOperation({ summary: 'Update visibility setting' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async updateVisibility(@Req() req: AuthenticatedRequest, @Body() updateDto: UpdateVisibilityDto): Promise<User> {
    return this.userService.update(req.user.userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('qr')
  @ApiOperation({ summary: 'Get friendCode for QR code generation' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async getQr(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) throw new BadRequestException('User not found');
    return { friendCode: user.friendCode };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @ApiOperation({ summary: 'Delete account (hard delete + cascade)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteAccount(@Req() req: AuthenticatedRequest, @Body() dto: DeleteAccountDto) {
    if (dto.confirmationText !== 'confirm-delete-my-account') {
      throw new BadRequestException('Must confirm deletion');
    }
    const userId = req.user.userId;
    if (!userId) throw new UnauthorizedException('Invalid token payload');
    return this.userService.deleteAccount(userId);
  }

  // --------------------
  // Sub-phase 1.3
  // --------------------

  @UseGuards(JwtAuthGuard)
  @Get('search')
  @ApiOperation({ summary: 'Search users with strict visibility filtering' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Users returned.' })
  async search(@Req() req: AuthenticatedRequest, @Query() query: SearchUsersDto) {
    return this.userService.searchUsers(req.user.userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/request')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Friend request sent.' })
  async requestFriend(@Req() req: AuthenticatedRequest, @Body() dto: FriendRequestDto) {
    return this.userService.requestFriend(req.user.userId, dto.targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Friend request accepted.' })
  async acceptFriend(@Req() req: AuthenticatedRequest, @Body() dto: FriendAcceptDto) {
    return this.userService.acceptFriend(req.user.userId, dto.requesterId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('friends/:friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Friend removed.' })
  async removeFriend(@Req() req: AuthenticatedRequest, @Param('friendId') friendId: string) {
    return this.userService.removeFriend(req.user.userId, friendId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('blocks')
  @ApiOperation({ summary: 'Block a user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'User blocked.' })
  async block(@Req() req: AuthenticatedRequest, @Body() dto: BlockDto) {
    return this.userService.blockUser(req.user.userId, dto.targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('blocks/:targetUserId')
  @ApiOperation({ summary: 'Unblock user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User unblocked.' })
  async unblock(@Req() req: AuthenticatedRequest, @Param('targetUserId') targetUserId: string) {
    return this.userService.unblockUser(req.user.userId, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends')
  @ApiOperation({ summary: 'Get friend list' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async listFriends(@Req() req: AuthenticatedRequest) {
    return this.userService.listFriends(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocks')
  @ApiOperation({ summary: 'Get blocked users' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  async listBlocks(@Req() req: AuthenticatedRequest) {
    return this.userService.listBlockedUsers(req.user.userId);
  }
}

