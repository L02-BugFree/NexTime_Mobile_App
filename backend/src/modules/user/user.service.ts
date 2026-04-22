import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check email unique
    const existingEmail = await this.userModel.findOne({ email: createUserDto.email });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check friendCode unique
    const existingCode = await this.userModel.findOne({ friendCode: createUserDto.friendCode });
    if (existingCode) {
      throw new ConflictException('Friend code already taken');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      friendCode: createUserDto.friendCode || `NEXTIME_${uuidv4().slice(0,8).toUpperCase()}`,
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
    return user as User;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result as User;
    }
    return null;
  }
}

