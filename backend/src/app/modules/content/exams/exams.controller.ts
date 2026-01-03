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
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { QueryExamsDto } from './dto/query-exams.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @RequirePermissions('exams:create')
  @ApiOperation({ summary: 'Create new exam' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  async create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exams' })
  async findAll(@Query() queryDto: QueryExamsDto) {
    return this.examsService.findAll(queryDto);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get exam by code' })
  async findByCode(@Param('code') code: string) {
    return this.examsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam by ID' })
  async findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('exams:update')
  @ApiOperation({ summary: 'Update exam' })
  async update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @RequirePermissions('exams:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exam (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.examsService.remove(id);
  }
}