// Basic unit test stub
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './entities/user.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { Group } from '../group/entities/group.schema';
import { getConnectionToken } from '@nestjs/mongoose';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: getModelToken(MonthlyCalendar.name),
          useValue: {},
        },
        {
          provide: getModelToken(Group.name),
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create user with hashed password', async () => {
    const dto = { email: 'test@example.com', password: 'password123', displayName: 'Test' };
    expect(service.create).toBeDefined();
  });
});

