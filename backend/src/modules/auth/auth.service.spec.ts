import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    validateUser: jest.Mock;
    findByEmail: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      validateUser: jest.fn(),
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns sanitized user from validateUser', async () => {
    userService.validateUser.mockResolvedValue({ _id: 'u1', email: 'u@test.com', password: 'secret' });

    const result = await service.validateUser('u@test.com', 'Test@123');

    expect(result).toEqual({ _id: 'u1', email: 'u@test.com' });
  });

  it('returns null from validateUser for invalid credentials', async () => {
    userService.validateUser.mockResolvedValue(null);

    const result = await service.validateUser('u@test.com', 'bad');
    expect(result).toBeNull();
  });

  it('creates login response with signed token', async () => {
    const result = await service.login({ _id: 'u1', email: 'u@test.com' });

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'u@test.com' });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: { _id: 'u1', email: 'u@test.com' },
    });
  });

  it('throws in forgotPassword when user does not exist', async () => {
    userService.findByEmail.mockResolvedValue(undefined);

    await expect(service.forgotPassword('missing@test.com')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('stores OTP and expiry in forgotPassword when user exists', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user: any = {
      email: 'u@test.com',
      otpCode: undefined,
      otpExpiry: undefined,
      save,
    };

    userService.findByEmail.mockResolvedValue(user);

    const result = await service.forgotPassword('u@test.com');

    expect(result).toEqual({ message: 'OTP sent to email (check console)' });
    expect(typeof user.otpCode).toBe('string');
    expect(user.otpCode).toHaveLength(6);
    expect(user.otpExpiry).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
  });

  it('throws in resetPassword for invalid OTP', async () => {
    userService.findByEmail.mockResolvedValue({
      otpCode: '111111',
      otpExpiry: new Date(Date.now() + 60000),
      save: jest.fn(),
    });

    await expect(service.resetPassword('u@test.com', '000000', 'NewPass@1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resets password for valid OTP', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user: any = {
      otpCode: '123456',
      otpExpiry: new Date(Date.now() + 60000),
      password: 'old',
      save,
    };

    userService.findByEmail.mockResolvedValue(user);

    const result = await service.resetPassword('u@test.com', '123456', 'NewPass@1');

    expect(result).toEqual({ message: 'Password reset successful' });
    expect(user.password).toBe('hashed-password');
    expect(user.otpCode).toBeUndefined();
    expect(user.otpExpiry).toBeUndefined();
    expect(save).toHaveBeenCalled();
  });

  it('blacklists token on logout', async () => {
    const token = 'abc';
    await service.logout(token);

    expect(service.isTokenBlacklisted(token)).toBe(true);
  });
});
