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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @RequirePermissions('subjects:create')
  @ApiOperation({ summary: 'Create new subject' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  async findAll(@Query() queryDto: QuerySubjectsDto) {
    return this.subjectsService.findAll(queryDto);
  }

  @Get('exam/:examId')
  @ApiOperation({ summary: 'Get subjects by exam' })
  async findByExam(@Param('examId') examId: string) {
    return this.subjectsService.findByExam(examId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  async findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('subjects:update')
  @ApiOperation({ summary: 'Update subject' })
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @RequirePermissions('subjects:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subject' })
  async remove(@Param('id') id: string) {
    await this.subjectsService.remove(id);
  }
}
