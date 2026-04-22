import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201 })
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user.toObject();
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new Error('Unauthorized'); // Temporary, import after deps
    }
    return this.authService.login(user);
  }

  @Post('google')
  @ApiOperation({ summary: 'Google OAuth login (stub)' })
  @ApiResponse({ status: 200 })
  async googleLogin(@Body() googleToken: any) {
    // Placeholder for Google verify
    // const ticket = await client.verifyIdToken({ idToken: googleToken.token, audience: process.env.GOOGLE_CLIENT_ID });
    return { message: 'Google login stub - integrate Google SDK', user: {} };
  }
}

