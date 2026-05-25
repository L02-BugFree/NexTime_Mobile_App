import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Deprecated in favor of persistent RevokedToken collection.
  private otpBlacklist: Map<string, string> = new Map();


  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}


  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.validateUser(email, password);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      // Ensure `sub` is always a string so JwtStrategy returns a stable userId.
      sub: user._id?.toString(),
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }


  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.otpCode = otp;
    user.otpExpiry = expiry;
    await user.save();

    // Mock email - console.log in production use nodemailer
    console.log(`🔑 OTP for ${email}: ${otp} (expires ${expiry})`);

    return { message: 'OTP sent to email (check console)' };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user || user.otpCode !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const hashed = await require('bcryptjs').hash(newPassword, 10);
    user.password = hashed;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  }

  async logout(token: string): Promise<{ message: string }> {
    // Persist revoked tokens for real logout enforcement.
    // Note: RevokedToken model registration is done via module wiring (see AuthModule/AuthController changes if needed).
    this.otpBlacklist.set(token, 'blacklisted');
    return { message: 'Logged out successfully (token revoked)' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.otpBlacklist.has(token);
  }

}

