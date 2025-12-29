import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionsService) {}

  @Get()
  getAllPermissions() {
    return this.permissionService.findAll();
  }

  @Post()
  createNewRole(@Body() newRole: CreatePermissionDto) {
    return this.permissionService.create(newRole);
  }

  @Patch(':id')
  updateRole(@Param('id') id: string, @Body() role: UpdatePermissionDto) {
    return this.permissionService.update(id, role);
  }

  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.permissionService.delete(id);
  }
}
