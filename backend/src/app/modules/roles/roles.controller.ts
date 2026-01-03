import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRolesDto } from './dto/query-roles.dto';
import { ManagePermissionsDto } from './dto/manage-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Roles, CurrentUser } from './../../common';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  async findAll(@Query() queryDto: QueryRolesDto) {
    return this.rolesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update role' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Add permissions to role' })
  async addPermissions(
    @Param('id') id: string,
    @Body() dto: ManagePermissionsDto,
  ) {
    return this.rolesService.addPermissions(id, dto.permissionIds);
  }

  @Delete(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove permissions from role' })
  async removePermissions(
    @Param('id') id: string,
    @Body() dto: ManagePermissionsDto,
  ) {
    return this.rolesService.removePermissions(id, dto.permissionIds);
  }

  @Post('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(
    @Body() dto: AssignRoleDto,
    @CurrentUser('id') assignedBy: string,
  ) {
    await this.rolesService.assignRoleToUser(dto.userId, dto.roleId, assignedBy);
  }

  @Delete('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(
    @Query('userId') userId: string,
    @Query('roleId') roleId: string,
  ) {
    await this.rolesService.removeRoleFromUser(userId, roleId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user roles' })
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }
}