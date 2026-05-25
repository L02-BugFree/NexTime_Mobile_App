import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import nodemailer from 'nodemailer';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  // Deprecated in favor of persistent RevokedToken collection.
  private otpBlacklist: Map<string, string> = new Map();

  private readonly googleClient: OAuth2Client;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

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

  async firebaseGoogleLogin(idToken: string): Promise<any> {
    try {
      if (!idToken || !process.env.GOOGLE_CLIENT_ID) {
        throw new BadRequestException(
          'Invalid or expired Firebase Google idToken signature',
        );
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!payload || !email) {
        throw new BadRequestException(
          'Invalid or expired Firebase Google idToken signature',
        );
      }

      const displayName = payload.name || payload.given_name || payload.family_name;

      let user = await this.userService.findByEmail(email);
      if (!user) {
        const randomPassword = crypto.randomBytes(24).toString('base64url');
        user = await this.userService.create({
          email,
          displayName: displayName || email.split('@')[0],
          password: randomPassword,
        } as any);
      }

      return this.login(user);
    } catch (err) {
      throw new BadRequestException(
        'Invalid or expired Firebase Google idToken signature',
      );
    }
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiry = expiry;
    await user.save();

    // Explicit terminal notification for local verification
    console.log(
      `🔑 OTP for ${email}: ${otp} (expires ${expiry.toISOString()})`,
    );

    const host = process.env.SMTP_HOST;
    const portRaw = process.env.SMTP_PORT;
    const userEnv = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const port = portRaw ? Number(portRaw) : NaN;

    if (!host || !port || !userEnv || !pass) {
      throw new InternalServerErrorException(
        'SMTP environment variables are not configured',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: userEnv, pass },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2 style="margin: 0 0 12px;">Your NexTime Password Reset OTP</h2>
        <p style="margin: 0 0 8px;">Use the following OTP to reset your password. This OTP expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</div>
        <p style="margin: 12px 0 0; color: #666; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: '[NexTime] Verification OTP',
        html: `<h3>Your code is: <b>${otp}</b></h3>`,
      });
    } catch (e) {
      throw new InternalServerErrorException(
        'SMTP transport layer failed to send the email connection',
      );
    }

    return { success: true };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userService.findByEmail(email);
    const now = new Date();

    const isOtpValid =
      !!user &&
      !!user.otpCode &&
      user.otpCode === otp &&
      !!user.otpExpiry &&
      now <= user.otpExpiry;

    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashed = await require('bcryptjs').hash(newPassword, 10);
    user.password = hashed;

    (user as any).otpCode = undefined;
    (user as any).otpExpiry = undefined;

    await user.save();
    return { success: true };
  }

  async logout(token: string): Promise<{ message: string }> {
    this.otpBlacklist.set(token, 'blacklisted');
    return { message: 'Logged out successfully (token revoked)' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.otpBlacklist.has(token);
  }
}
