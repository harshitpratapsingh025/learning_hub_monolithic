import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CacheService } from '../../cache/cache.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { Role, RoleDocument } from '../roles/schemas';
import { UserRole, UserRoleDocument } from '../user-roles/schemas';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>,
    private readonly cacheService: CacheService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: createUserDto.phone,
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      passwordHash,
    });

    await user.save();

    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.assignRolesToUser(
        user._id.toString(),
        createUserDto.roleIds,
        user._id.toString()
      );
    }

    this.logger.log(`User created: ${user.email}`);

    return this.findOne(user._id.toString());
  }

  async findAll(queryDto: QueryUsersDto) {
    const { search, isActive, isVerified, limit = 20, offset = 0 } = queryDto;

    const cacheKey = `users:list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .populate({
          path: 'roles',
          populate: {
            path: 'permissions',
          },
        })
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    const result = {
      data: users.map((user) => this.transformUser(user)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get(cacheKey) as User;

    if (cached) {
      return cached;
    }

    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transformed = this.transformUser(user);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    await user.save();

    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.deletePattern('users:list:*');

    this.logger.log(`User updated: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.deletePattern('users:list:*');

    this.logger.log(`User deleted (soft): ${id}`);
  }

  private async assignRolesToUser(
    userId: string,
    roleIds: string[],
    assignedBy: string
  ): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    for (const roleId of roleIds) {
      const roleObjectId = new Types.ObjectId(roleId);

      const role = await this.roleModel.findById(roleObjectId);
      if (!role) {
        throw new NotFoundException(`Role ${roleId} not found`);
      }

      const existing = await this.userRoleModel.findOne({
        userId: userObjectId,
        roleId: roleObjectId,
      });

      if (!existing) {
        const userRole = new this.userRoleModel({
          userId: userObjectId,
          roleId: roleObjectId,
          assignedBy: new Types.ObjectId(assignedBy),
        });
        await userRole.save();

        await this.userModel.updateOne(
          { _id: userObjectId },
          { $addToSet: { roles: roleObjectId } }
        );
      }
    }
  }
  private transformUser(user: any): User {
    const { passwordHash, ...sanitized } = user;
    return {
      ...sanitized,
      id: user._id.toString(),
    };
  }
}
