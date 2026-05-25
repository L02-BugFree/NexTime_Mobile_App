import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.schema';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { Group } from '../group/entities/group.schema';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userModel: any;
  let monthlyCalendarModel: any;
  let groupModel: any;

  beforeEach(async () => {
    const save = jest.fn().mockResolvedValue({ _id: 'u1' });
    const userModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save,
    }));

    userModelMock.findOne = jest.fn();
    userModelMock.findById = jest.fn();
    userModelMock.updateOne = jest.fn();
    userModelMock.find = jest.fn();
    userModelMock.findByIdAndUpdate = jest.fn();
    userModelMock.findByIdAndDelete = jest.fn();

    const monthlyCalendarMock = { deleteMany: jest.fn() };
    const groupCollection = {
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    };
    const groupModelMock = {
      updateMany: jest.fn(),
      db: { collection: jest.fn().mockReturnValue(groupCollection) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
        {
          provide: getModelToken(MonthlyCalendar.name),
          useValue: monthlyCalendarMock,
        },
        {
          provide: getModelToken(Group.name),
          useValue: groupModelMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get(getModelToken(User.name));
    monthlyCalendarModel = module.get(getModelToken(MonthlyCalendar.name));
    groupModel = module.get(getModelToken(Group.name));
  });

  const uid = '507f1f77bcf86cd799439011';
  const uid2 = '507f1f77bcf86cd799439012';
  const q = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

  it('creates a user when email and friendCode are unique', async () => {
    userModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.create({
      email: 'test@example.com',
      password: 'Test@1234',
      displayName: 'Test User',
      friendCode: 'USERX001',
    } as any);

    expect(result).toEqual({ _id: 'u1' });
    expect(userModel.findOne).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalled();
  });

  it('throws conflict when email already exists', async () => {
    userModel.findOne.mockResolvedValueOnce({ _id: 'existing' });

    await expect(
      service.create({
        email: 'test@example.com',
        password: 'Test@1234',
        displayName: 'Test User',
        friendCode: 'USERX001',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws conflict when friend code already exists', async () => {
    userModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: 'existing-code' });

    await expect(
      service.create({
        email: 'test@example.com',
        password: 'Test@1234',
        displayName: 'Test User',
        friendCode: 'USERX001',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findByEmail returns selected user', async () => {
    userModel.findOne.mockReturnValue({
      select: () => ({ exec: jest.fn().mockResolvedValue({ _id: uid, email: 'u@test.com' }) }),
    });

    const result = await service.findByEmail('u@test.com');
    expect(result).toEqual({ _id: uid, email: 'u@test.com' });
  });

  it('findById and update return updated data', async () => {
    userModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: uid }) });
    userModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: uid, displayName: 'New' }) });

    const found = await service.findById(uid);
    const updated = await service.update(uid, { displayName: 'New' });

    expect(found).toEqual({ _id: uid });
    expect(updated).toEqual({ _id: uid, displayName: 'New' });
  });

  it('validateUser returns sanitized object when password matches', async () => {
    userModel.findOne.mockReturnValue({
      select: () => ({ exec: jest.fn().mockResolvedValue({
        _id: uid,
        email: 'u@test.com',
        password: 'hashed',
        toObject: () => ({ _id: uid, email: 'u@test.com', password: 'hashed' }),
      }) }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('u@test.com', 'Test@123');
    expect(result).toEqual({ _id: uid, email: 'u@test.com' });
  });

  it('validateUser returns null when password does not match', async () => {
    userModel.findOne.mockReturnValue({
      select: () => ({ exec: jest.fn().mockResolvedValue({ password: 'hashed', toObject: () => ({}) }) }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await service.validateUser('u@test.com', 'wrong');
    expect(result).toBeNull();
  });

  it('requestFriend handles validation and success branches', async () => {
    await expect(service.requestFriend(uid, uid)).rejects.toBeInstanceOf(BadRequestException);

    userModel.findById.mockReturnValueOnce(q(null)).mockReturnValueOnce(q(null));
    await expect(service.requestFriend(uid, uid2)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [{ toString: () => uid2 }], friends: [], friendRequests: [] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friends: [], friendRequests: [] }));
    await expect(service.requestFriend(uid, uid2)).rejects.toBeInstanceOf(ConflictException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [], friends: [{ toString: () => uid2 }], friendRequests: [] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friends: [], friendRequests: [] }));
    await expect(service.requestFriend(uid, uid2)).rejects.toBeInstanceOf(ConflictException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [], friends: [], friendRequests: [] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friends: [], friendRequests: [] }));
    userModel.updateOne.mockResolvedValue({ acknowledged: true });

    const result = await service.requestFriend(uid, uid2);
    expect(result).toEqual({ message: 'Friend request sent' });
    expect(userModel.updateOne).toHaveBeenCalled();
  });

  it('accept/remove/block/unblock flows work across branches', async () => {
    await expect(service.acceptFriend(uid, uid)).rejects.toBeInstanceOf(BadRequestException);

    userModel.findById.mockReturnValueOnce(q(null)).mockReturnValueOnce(q(null));
    await expect(service.acceptFriend(uid, uid2)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [{ toString: () => uid2 }], friendRequests: [{ toString: () => uid2 }] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [] }));
    await expect(service.acceptFriend(uid, uid2)).rejects.toBeInstanceOf(ConflictException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [] }));
    await expect(service.acceptFriend(uid, uid2)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [{ toString: () => uid2 }] }))
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [] }));
    userModel.updateOne.mockResolvedValue({ acknowledged: true });
    await expect(service.acceptFriend(uid, uid2)).resolves.toEqual({ message: 'Friend request accepted' });

    await expect(service.removeFriend(uid, uid)).rejects.toBeInstanceOf(BadRequestException);
    userModel.findById.mockReturnValueOnce(q(null)).mockReturnValueOnce(q(null));
    await expect(service.removeFriend(uid, uid2)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById.mockReturnValueOnce(q({})).mockReturnValueOnce(q({}));
    await expect(service.removeFriend(uid, uid2)).resolves.toEqual({ message: 'Friend removed' });

    await expect(service.blockUser(uid, uid)).rejects.toBeInstanceOf(BadRequestException);
    userModel.findById.mockReturnValueOnce(q(null)).mockReturnValueOnce(q(null));
    await expect(service.blockUser(uid, uid2)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById
      .mockReturnValueOnce(q({ friends: [{ toString: () => uid2 }] }))
      .mockReturnValueOnce(q({ friends: [] }));
    await expect(service.blockUser(uid, uid2)).resolves.toEqual({ message: 'User blocked' });

    await expect(service.unblockUser(uid, uid2)).resolves.toEqual({ message: 'User unblocked' });
  });

  it('search/list and delete account branches', async () => {
    const searchQuery = { query: 'u@test.com' } as any;

    await expect(service.searchUsers(uid, { query: '   ' } as any)).resolves.toEqual([]);

    userModel.findById.mockReturnValueOnce(q(null));
    await expect(service.searchUsers(uid, searchQuery)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById.mockReturnValueOnce(q({ blockedUsers: [], friends: [] }));
    userModel.find
      .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([{ _id: { toString: () => uid2 }, email: 'u@test.com', visibilitySetting: 'everyone', friends: [] }]) });
    const searchResults = await service.searchUsers(uid, searchQuery);
    expect(searchResults).toHaveLength(1);

    userModel.findById.mockReturnValueOnce(q(null));
    await expect(service.listFriends(uid)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById.mockReturnValueOnce(q({ friends: [{ toString: () => uid2 }] }));
    userModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: uid2 }]) });
    await expect(service.listFriends(uid)).resolves.toEqual([{ _id: uid2 }]);

    userModel.findById.mockReturnValue({
      populate: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    });
    await expect(service.listBlockedUsers(uid)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findById.mockReturnValue({
      populate: () => ({ exec: jest.fn().mockResolvedValue({ blockedUsers: [{ _id: uid2 }] }) }),
    });
    await expect(service.listBlockedUsers(uid)).resolves.toEqual([{ _id: uid2 }]);

    await expect(service.deleteAccount('')).rejects.toBeInstanceOf(BadRequestException);

    userModel.findByIdAndDelete.mockResolvedValueOnce(null);
    await expect(service.deleteAccount(uid)).rejects.toBeInstanceOf(NotFoundException);

    userModel.findByIdAndDelete.mockResolvedValueOnce({ _id: uid });
    await expect(service.deleteAccount(uid)).resolves.toEqual({ message: 'Account deleted successfully (monthly calendars & groups cleaned)' });
    expect(monthlyCalendarModel.deleteMany).toHaveBeenCalled();
    expect(groupModel.updateMany).toHaveBeenCalled();
  });

  it('searchUsers enforces contacts and friends visibility rules', async () => {
    const friendA = '507f1f77bcf86cd799439013';
    userModel.findById.mockReturnValueOnce(q({ blockedUsers: [], friends: [{ toString: () => friendA }] }));
    userModel.find
      .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => 'c1' },
            email: 'exact@match.com',
            visibilitySetting: 'contacts',
            friends: [],
          },
          {
            _id: { toString: () => 'f1' },
            email: 'notexact@match.com',
            visibilitySetting: 'friends',
            friends: [{ toString: () => friendA }],
          },
        ]),
      });

    const result = await service.searchUsers(uid, { query: 'exact@match.com' } as any);
    expect(result).toHaveLength(2);
  });

  it('searchUsers includes FRIENDS candidate on exact email match', async () => {
    userModel.findById.mockReturnValueOnce(q({ blockedUsers: [], friends: [] }));
    userModel.find
      .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => 'f2' },
            email: 'friends@exact.com',
            visibilitySetting: 'friends',
            friends: [],
          },
        ]),
      });

    const result = await service.searchUsers(uid, { query: 'friends@exact.com' } as any);
    expect(result).toHaveLength(1);
  });

  it('acceptFriend rejects when requester has blocked user', async () => {
    userModel.findById
      .mockReturnValueOnce(q({ blockedUsers: [], friendRequests: [{ toString: () => uid2 }] }))
      .mockReturnValueOnce(q({ blockedUsers: [{ toString: () => uid }], friendRequests: [] }));

    await expect(service.acceptFriend(uid, uid2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('blockUser works when target is not in requester friend list', async () => {
    userModel.findById
      .mockReturnValueOnce(q({ friends: [] }))
      .mockReturnValueOnce(q({ friends: [] }));
    userModel.updateOne.mockResolvedValue({ acknowledged: true });

    const result = await service.blockUser(uid, uid2);
    expect(result).toEqual({ message: 'User blocked' });
  });

  it('searchUsers excludes FRIENDS candidate without exact email and no mutual friends', async () => {
    userModel.findById.mockReturnValueOnce(q({ blockedUsers: [], friends: [{ toString: () => 'f-common' }] }));
    userModel.find
      .mockReturnValueOnce({ select: () => ({ exec: jest.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => 'f3' },
            email: 'nope@example.com',
            visibilitySetting: 'friends',
            friends: [{ toString: () => 'f-other' }],
          },
        ]),
      });

    const result = await service.searchUsers(uid, { query: 'notexact@example.com' } as any);
    expect(result).toEqual([]);
  });
});

