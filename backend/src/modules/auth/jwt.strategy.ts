import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secretKey',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // Jwt payload: { sub: userId, email }
    const userId =
      typeof payload?.sub === 'string' ? payload.sub : payload?.sub?.toString();
    const email =
      typeof payload?.email === 'string' ? payload?.email : undefined;

    // Global blacklist enforcement via AuthService. Requires passReqToCallback: true.
    const authHeader: string | undefined = req?.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : authHeader;

    if (token && this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been invalidated via logout');
    }

    if (!userId) throw new UnauthorizedException('Invalid token payload');

    return { userId, email };
  }
}
