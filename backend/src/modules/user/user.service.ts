import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, VisibilitySetting } from './entities/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { MonthlyCalendar } from '../schedule/entities/monthly-calendar.schema';
import { Group } from '../group/entities/group.schema';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MonthlyCalendar.name) private monthlyCalendarModel: Model<MonthlyCalendar>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userModel.findOne({ email: createUserDto.email });
    if (existingEmail) throw new ConflictException('Email already exists');

    const existingCode = await this.userModel.findOne({ friendCode: createUserDto.friendCode });
    if (existingCode) throw new ConflictException('Friend code already taken');

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      friendCode: createUserDto.friendCode || `NEXTIME_${uuidv4().slice(0, 8).toUpperCase()}`,
    };

    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ email }).select('+password').exec();
    return user as User | undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id).exec();
    return user as User | undefined;
  }

  async update(id: string, updateData: any): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    return user!;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _pw, ...result } = user.toObject();
      return result as User;
    }
    return null;
  }

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  async searchUsers(searcherId: string, dto: SearchUsersDto): Promise<User[]> {
    const query = dto.query?.trim();
    if (!query) return [];

    const searcher = await this.userModel.findById(searcherId).exec();
    if (!searcher) throw new NotFoundException('Searching user not found');

    const blockedBySearcher = new Set((searcher.blockedUsers || []).map((x) => x.toString()));

    const usersBlockingSearcher = await this.userModel
      .find({ blockedUsers: this.toObjectId(searcherId) })
      .select('_id blockedUsers')
      .exec();
    const blockedByOthers = new Set(usersBlockingSearcher.map((u) => u._id.toString()));

    const q = query;
    const isExactEmailMatch = (u: User) => u.email === q;

    const candidates = await this.userModel
      .find({
        _id: { $ne: this.toObjectId(searcherId) },
        $or: [{ email: q }, { displayName: q }, { friendCode: q }],
      })
      .exec();

    const searcherFriends = new Set((searcher.friends || []).map((x) => x.toString()));

    const results: User[] = [];

    for (const candidate of candidates) {
      const candidateId = candidate._id.toString();

      // Exclude any block relationship (either direction)
      if (blockedBySearcher.has(candidateId)) continue;
      if (blockedByOthers.has(candidateId)) continue;

      const exactEmailMatch = isExactEmailMatch(candidate);
      const visibility = (candidate.visibilitySetting as VisibilitySetting) || VisibilitySetting.EVERYONE;

      if (visibility === VisibilitySetting.EVERYONE) {
        results.push(candidate);
        continue;
      }

      if (visibility === VisibilitySetting.CONTACTS) {
        if (exactEmailMatch) results.push(candidate);
        continue;
      }

      if (visibility === VisibilitySetting.FRIENDS) {
        if (exactEmailMatch) {
          results.push(candidate);
          continue;
        }

        const candidateFriends = new Set((candidate.friends || []).map((x) => x.toString()));
        let hasMutual = false;
        for (const f of searcherFriends) {
          if (candidateFriends.has(f)) {
            hasMutual = true;
            break;
          }
        }

        if (hasMutual) results.push(candidate);
      }
    }

    return results;
  }

  async requestFriend(requesterId: string, targetUserId: string): Promise<{ message: string }> {
    if (requesterId === targetUserId) throw new BadRequestException('Cannot friend yourself');

    const requester = await this.userModel.findById(requesterId).exec();
    const target = await this.userModel.findById(targetUserId).exec();
    if (!requester || !target) throw new NotFoundException('User not found');

    // Fail if either side has blocked relationship
    const requesterBlockedTarget = (requester.blockedUsers || []).some((id) => id.toString() === targetUserId);
    const targetBlockedRequester = (target.blockedUsers || []).some((id) => id.toString() === requesterId);
    if (requesterBlockedTarget || targetBlockedRequester) {
      throw new BadRequestException('Cannot send request to a blocked user');
    }

    // Already friends
    const alreadyFriends = (requester.friends || []).some((id) => id.toString() === targetUserId);
    if (alreadyFriends) throw new ConflictException('Users are already friends');

    // Push request if not exists
    const alreadyRequested = (target.friendRequests || []).some((id) => id.toString() === requesterId);
    if (!alreadyRequested) {
      await this.userModel.updateOne(
        { _id: this.toObjectId(targetUserId) },
        { $addToSet: { friendRequests: this.toObjectId(requesterId) } },
      );
    }

    return { message: 'Friend request sent' };
  }

  async acceptFriend(userId: string, requesterId: string): Promise<{ message: string }> {
    if (userId === requesterId) throw new BadRequestException('Invalid requester');

    const [user, requester] = await Promise.all([
      this.userModel.findById(userId).exec(),
      this.userModel.findById(requesterId).exec(),
    ]);

    if (!user || !requester) throw new NotFoundException('User not found');

    // Fail if either side blocks relationship
    const blocked = (user.blockedUsers || []).some((id) => id.toString() === requesterId) ||
      (requester.blockedUsers || []).some((id) => id.toString() === userId);
    if (blocked) throw new ConflictException('Cannot accept request due to block relationship');

    const hasRequest = (user.friendRequests || []).some((id) => id.toString() === requesterId);
    if (!hasRequest) throw new NotFoundException('Friend request not found');

    // Move requesterId from friendRequests to friends for both users
    await Promise.all([
      this.userModel.updateOne(
        { _id: this.toObjectId(userId) },
        {
          $pull: { friendRequests: this.toObjectId(requesterId) },
          $addToSet: { friends: this.toObjectId(requesterId) },
        },
      ),
      this.userModel.updateOne(
        { _id: this.toObjectId(requesterId) },
        {
          $pull: { friendRequests: this.toObjectId(userId) },
          $addToSet: { friends: this.toObjectId(userId) },
        },
      ),
    ]);

    return { message: 'Friend request accepted' };
  }

  async removeFriend(userId: string, friendId: string): Promise<{ message: string }> {
    if (userId === friendId) throw new BadRequestException('Invalid friend');

    const [user, friend] = await Promise.all([
      this.userModel.findById(userId).exec(),
      this.userModel.findById(friendId).exec(),
    ]);
    if (!user || !friend) throw new NotFoundException('User not found');

    await Promise.all([
      this.userModel.updateOne(
        { _id: this.toObjectId(userId) },
        { $pull: { friends: this.toObjectId(friendId) } },
      ),
      this.userModel.updateOne(
        { _id: this.toObjectId(friendId) },
        { $pull: { friends: this.toObjectId(userId) } },
      ),
    ]);

    return { message: 'Friend removed' };
  }

  async blockUser(
    requesterId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    if (requesterId === targetUserId)
      throw new BadRequestException('Cannot block yourself');

    const [requester, target] = await Promise.all([
      this.userModel.findById(requesterId).exec(),
      this.userModel.findById(targetUserId).exec(),
    ]);

    if (!requester || !target) throw new NotFoundException('User not found');

    // If they were friends, remove from friends arrays
    const isFriend = (requester.friends || []).some(
      (id) => id.toString() === targetUserId,
    );

    const updateData: Record<string, unknown> = {
      $addToSet: {
        blockedUsers: this.toObjectId(targetUserId),
      },
    };

    if (isFriend) {
      updateData.$pull = {
        friends: this.toObjectId(targetUserId),
      };
    }

    await this.userModel.updateOne(
      { _id: this.toObjectId(requesterId) },
      updateData,
    );

    // Also remove from target's friends array if needed
    const targetUpdateData: Record<string, unknown> = {};

    if (isFriend) {
      targetUpdateData.$pull = {
        friends: this.toObjectId(requesterId),
      };
    }

    await this.userModel.updateOne(
      { _id: this.toObjectId(targetUserId) },
      targetUpdateData,
    );

    // Remove any pending friend requests in either direction
    await Promise.all([
      this.userModel.updateOne(
        { _id: this.toObjectId(requesterId) },
        {
          $pull: {
            friendRequests: this.toObjectId(targetUserId),
          },
        },
      ),

      this.userModel.updateOne(
        { _id: this.toObjectId(targetUserId) },
        {
          $pull: {
            friendRequests: this.toObjectId(requesterId),
          },
        },
      ),
    ]);

    return { message: 'User blocked' };
  }

  async unblockUser(
    requesterId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    await this.userModel.updateOne(
      { _id: this.toObjectId(requesterId) },
      { $pull: { blockedUsers: this.toObjectId(targetUserId) } },
    );

    return { message: 'User unblocked' };
  }

  async listFriends(userId: string): Promise<User[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    return this.userModel.find({ _id: { $in: user.friends || [] } }).exec();
  }

  async listBlockedUsers(userId: string): Promise<User[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('blockedUsers', 'displayName email avatar')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.blockedUsers as unknown as User[];
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    if (!userId) throw new BadRequestException('User ID is required');

    // CRITICAL: keep cascade logic fixed earlier
    await this.monthlyCalendarModel.deleteMany({ userId });
    await this.groupModel.updateMany({ members: userId }, { $pull: { members: userId } });

    // Cascade cleanup for rooms (remove any DIRECT participation)
    // 1) Delete rooms owned by the user.
    await this.groupModel.db.collection('rooms').deleteMany({ ownerId: new Types.ObjectId(userId) });

    // 2) Pull user from DIRECT participants.
    await this.groupModel.db.collection('rooms').updateMany(
      { $or: [{ userA: new Types.ObjectId(userId) }, { userB: new Types.ObjectId(userId) }] },
      {
        $pull: {
          userA: new Types.ObjectId(userId),
          userB: new Types.ObjectId(userId),
        },
      } as any,
    );


    // 3) Remove from GROUP members arrays inside rooms (if stored there).
    await this.groupModel.db.collection('rooms').updateMany(
      {},
      { $pull: { members: new Types.ObjectId(userId) } } as any,
    );







    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) throw new NotFoundException('User not found or already deleted');

    return { message: 'Account deleted successfully (monthly calendars & groups cleaned)' };
  }
}

