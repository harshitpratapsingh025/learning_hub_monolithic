import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Permission } from './schemas';
import { Model } from 'mongoose';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModal: Model<Permission>
  ) {}

  async findAll() {
    return this.permissionModal.find({ isActive: true }).lean();
  }

  async create(permission: CreatePermissionDto) {
    return this.permissionModal.create(permission);
  }

  async update(id: string, permission: UpdatePermissionDto) {
    const updated = await this.permissionModal.findOneAndUpdate(
      { _id: id },
      permission,
      { new: true }
    );

    if (!updated) throw new NotFoundException('Permission not found');
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.permissionModal.findOneAndUpdate(
      { _id: id },
      { isActive: false },
      { new: true }
    );

    if (!deleted) throw new NotFoundException('Permission not found');
    return deleted;
  }
}
