import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleDocument } from './schemas';
import { Permission, PermissionDocument } from '../permissions/schemas';
import { User, UserDocument } from '../users/schemas';
import { UserRole, UserRoleDocument } from '../user-roles/schemas';
import { QueryRolesDto } from './dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleModel.findOne({
      name: createRoleDto.name,
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionModel.find({
        _id: {
          $in: createRoleDto.permissionIds.map((id) => new Types.ObjectId(id)),
        },
      });

      if (permissions.length !== createRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permissions do not exist');
      }
    }

    const role = new this.roleModel({
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissions:
        createRoleDto.permissionIds?.map((id) => new Types.ObjectId(id)) || [],
    });

    await role.save();

    // Invalidate cache
    await this.cacheService.deletePattern('roles:*');

    this.logger.log(`Role created: ${role.name}`);

    return this.findOne(role._id.toString());
  }

  async findAll(queryDto: QueryRolesDto) {
    const { search, isActive, limit = 50, offset = 0 } = queryDto;

    const cacheKey = `roles:list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [roles, total] = await Promise.all([
      this.roleModel
        .find(query)
        .populate('permissions')
        .skip(offset)
        .limit(limit)
        .sort({ name: 1 })
        .lean(),
      this.roleModel.countDocuments(query),
    ]);

    const result = {
      data: roles.map((role) => this.transformRole(role)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Role> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid role ID');
    }

    const cacheKey = `role:${id}`;
    const cached = await this.cacheService.get(cacheKey) as Role;

    if (cached) {
      return cached;
    }

    const role = await this.roleModel
      .findById(id)
      .populate('permissions')
      .lean();

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const transformed = this.transformRole(role);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid role ID');
    }

    const role = await this.roleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleModel.findOne({
        name: updateRoleDto.name,
        _id: { $ne: id },
      });
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionModel.find({
        _id: {
          $in: updateRoleDto.permissionIds.map((id) => new Types.ObjectId(id)),
        },
      });

      if (permissions.length !== updateRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permissions do not exist');
      }

      role.permissions = updateRoleDto.permissionIds.map(
        (id) => new Types.ObjectId(id),
      );
      delete updateRoleDto.permissionIds;
    }

    Object.assign(role, updateRoleDto);
    await role.save();

    // Invalidate cache
    await this.cacheService.delete(`role:${id}`);
    await this.cacheService.deletePattern('roles:*');
    await this.cacheService.deletePattern('user:*'); // Users have roles

    this.logger.log(`Role updated: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid role ID');
    }

    const role = await this.roleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to users
    const usersWithRole = await this.userRoleModel.countDocuments({
      roleId: role._id,
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete role. It is assigned to ${usersWithRole} user(s)`,
      );
    }

    await this.roleModel.findByIdAndDelete(id);

    // Invalidate cache
    await this.cacheService.delete(`role:${id}`);
    await this.cacheService.deletePattern('roles:*');

    this.logger.log(`Role deleted: ${id}`);
  }

  async addPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    const role = await this.roleModel.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionModel.find({
      _id: { $in: permissionIds.map((id) => new Types.ObjectId(id)) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permissions do not exist');
    }

    const newPermissions = permissionIds.map((id) => new Types.ObjectId(id));
    role.permissions = [
      ...new Set([
        ...role.permissions.map(String),
        ...newPermissions.map(String),
      ]),
    ].map((id) => new Types.ObjectId(id));

    await role.save();

    // Invalidate cache
    await this.cacheService.delete(`role:${roleId}`);
    await this.cacheService.deletePattern('roles:*');
    await this.cacheService.deletePattern('user:*');

    this.logger.log(`Permissions added to role: ${roleId}`);

    return this.findOne(roleId);
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    const role = await this.roleModel.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissionIdsToRemove = permissionIds.map((id) => id.toString());
    role.permissions = role.permissions.filter(
      (perm) => !permissionIdsToRemove.includes(perm.toString()),
    );

    await role.save();

    // Invalidate cache
    await this.cacheService.delete(`role:${roleId}`);
    await this.cacheService.deletePattern('roles:*');
    await this.cacheService.deletePattern('user:*');

    this.logger.log(`Permissions removed from role: ${roleId}`);

    return this.findOne(roleId);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
  ): Promise<void> {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(roleId)
    ) {
      throw new BadRequestException('Invalid user ID or role ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleModel.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const existing = await this.userRoleModel.findOne({
      userId: new Types.ObjectId(userId),
      roleId: new Types.ObjectId(roleId),
    });

    if (existing) {
      throw new ConflictException('Role already assigned to user');
    }

    const userRole = new this.userRoleModel({
      userId: new Types.ObjectId(userId),
      roleId: new Types.ObjectId(roleId),
      assignedBy: new Types.ObjectId(assignedBy),
    });

    await userRole.save();

    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { roles: new Types.ObjectId(roleId) } },
    );

    // Invalidate cache
    await this.cacheService.delete(`user:${userId}`);
    await this.cacheService.deletePattern('users:*');

    this.logger.log(`Role ${roleId} assigned to user ${userId}`);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(roleId)
    ) {
      throw new BadRequestException('Invalid user ID or role ID');
    }

    const userRole = await this.userRoleModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      roleId: new Types.ObjectId(roleId),
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { roles: new Types.ObjectId(roleId) } },
    );

    // Invalidate cache
    await this.cacheService.delete(`user:${userId}`);
    await this.cacheService.deletePattern('users:*');

    this.logger.log(`Role ${roleId} removed from user ${userId}`);
  }

  async getUserRoles(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const cacheKey = `user:${userId}:roles`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const userRoles = await this.userRoleModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'roleId',
        populate: {
          path: 'permissions',
        },
      })
      .lean();

    const result = userRoles.map((ur: any) => ({
      id: ur._id.toString(),
      role: {
        ...ur.roleId,
        id: ur.roleId._id.toString(),
      },
      assignedAt: ur.assignedAt,
    }));

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  private transformRole(role: any): Role {
    return {
      ...role,
      id: role._id.toString(),
    };
  }
}