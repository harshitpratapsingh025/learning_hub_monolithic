import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Get()
  getAllTheRoles() {
    return this.roleService.findAll();
  }

  @Post()
  createNewRole(@Body() newRole: CreateRoleDto ) {
    return this.roleService.create(newRole);
  }

  @Patch(':id')
  updateRole(@Param('id') id: string, @Body() role: UpdateRoleDto ) {
    return this.roleService.update(id, role);
  }

  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}
