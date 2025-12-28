import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from './schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>
  ) {}

  async findAll() {
    return this.roleModel.find({ isActive: true }).lean();
  }

  async create(role: CreateRoleDto) {
    return this.roleModel.create(role);
  }

  async update(id: string, role: UpdateRoleDto) {
    const updatedRole = await this.roleModel.findOneAndUpdate(
      { _id: id },
      role,
      { new: true }
    );

    if (!updatedRole) throw new NotFoundException('Role not found');
    return updatedRole;
  }

  async delete(id: string) {
    const deletedRole = await this.roleModel.findOneAndUpdate(
      { _id: id },
      { isActive: false },
      { new: true }
    );

    if (!deletedRole) throw new NotFoundException('Role not found');
    return deletedRole;
  }
}
