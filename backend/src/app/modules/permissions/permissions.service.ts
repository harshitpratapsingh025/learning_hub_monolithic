import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from './schemas';
import { Role, RoleDocument } from '../roles/schemas';
import { CacheService } from './../../cache/cache.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionsDto } from './dto/query-permissions.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private readonly cacheService: CacheService
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionModel.findOne({
      name: createPermissionDto.name,
    });

    if (existingPermission) {
      throw new ConflictException('Permission name already exists');
    }

    const permission = new this.permissionModel(createPermissionDto);
    await permission.save();

    // Invalidate cache
    await this.cacheService.deletePattern('permissions:*');

    this.logger.log(`Permission created: ${permission.name}`);

    return this.transformPermission(permission.toObject());
  }

  async findAll(queryDto: QueryPermissionsDto) {
    const { search, resource, action, limit = 100, offset = 0 } = queryDto;

    const cacheKey = `permissions:list:${JSON.stringify(queryDto)}`;
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

    if (resource) {
      query.resource = resource;
    }

    if (action) {
      query.action = action;
    }

    const [permissions, total] = await Promise.all([
      this.permissionModel
        .find(query)
        .skip(offset)
        .limit(limit)
        .sort({ resource: 1, action: 1 })
        .lean(),
      this.permissionModel.countDocuments(query),
    ]);

    const result = {
      data: permissions.map((perm) => this.transformPermission(perm)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Permission> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid permission ID');
    }

    const cacheKey = `permission:${id}`;
    const cached = await this.cacheService.get(cacheKey) as Permission;

    if (cached) {
      return cached;
    }

    const permission = await this.permissionModel.findById(id).lean();

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const transformed = this.transformPermission(permission);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto
  ): Promise<Permission> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid permission ID');
    }

    const permission = await this.permissionModel.findById(id);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (
      updatePermissionDto.name &&
      updatePermissionDto.name !== permission.name
    ) {
      const existingPermission = await this.permissionModel.findOne({
        name: updatePermissionDto.name,
        _id: { $ne: id },
      });
      if (existingPermission) {
        throw new ConflictException('Permission name already exists');
      }
    }

    Object.assign(permission, updatePermissionDto);
    await permission.save();

    // Invalidate cache
    await this.cacheService.delete(`permission:${id}`);
    await this.cacheService.deletePattern('permissions:*');
    await this.cacheService.deletePattern('role:*');
    await this.cacheService.deletePattern('user:*');

    this.logger.log(`Permission updated: ${id}`);

    return this.transformPermission(permission.toObject());
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid permission ID');
    }

    const permission = await this.permissionModel.findById(id);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const rolesWithPermission = await this.roleModel.countDocuments({
      permissions: permission._id,
    });

    if (rolesWithPermission > 0) {
      throw new BadRequestException(
        `Cannot delete permission. It is assigned to ${rolesWithPermission} role(s)`
      );
    }

    await this.permissionModel.findByIdAndDelete(id);

    // Invalidate cache
    await this.cacheService.delete(`permission:${id}`);
    await this.cacheService.deletePattern('permissions:*');

    this.logger.log(`Permission deleted: ${id}`);
  }

  async getResources(): Promise<string[]> {
    const cacheKey = 'permissions:resources';
    const cached = await this.cacheService.get<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const resources = await this.permissionModel.distinct('resource');
    const sorted = resources.sort();

    await this.cacheService.set(cacheKey, sorted, this.CACHE_TTL);

    return sorted;
  }

  async getActions(): Promise<string[]> {
    const cacheKey = 'permissions:actions';
    const cached = await this.cacheService.get<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const actions = await this.permissionModel.distinct('action');
    const sorted = actions.sort();

    await this.cacheService.set(cacheKey, sorted, this.CACHE_TTL);

    return sorted;
  }

  private transformPermission(permission: any): Permission {
    return {
      ...permission,
      id: permission._id.toString(),
    };
  }
}
