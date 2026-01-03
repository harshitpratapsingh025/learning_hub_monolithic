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
import { PermissionsService } from './permissions.service';
import { QueryPermissionsDto } from './dto/query-permissions.dto';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  async findAll(@Query() queryDto: QueryPermissionsDto) {
    return this.permissionsService.findAll(queryDto);
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get all resources' })
  async getResources() {
    return this.permissionsService.getResources();
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get all actions' })
  async getActions() {
    return this.permissionsService.getActions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update permission' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
  }
}
