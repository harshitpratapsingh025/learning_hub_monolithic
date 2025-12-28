// users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.userModel.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 12),
    });

    return this.sanitize(user);
  }

  async findAll() {
    const users = await this.userModel
      .find({ deletedAt: null })
      .lean();

    return users.map(this.sanitize);
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .lean();

    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      dto,
      { new: true },
    );

    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async remove(id: string) {
    const result = await this.userModel.updateOne(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
    );

    if (!result.matchedCount) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
  }

  private sanitize(user: any) {
    const { password, __v, deletedAt, ...safe } = user;
    return {
      id: safe._id,
      ...safe,
    };
  }
}
