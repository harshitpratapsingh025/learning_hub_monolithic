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
import { 
  CreateSubjectDto, 
  UpdateSubjectDto, 
  QuerySubjectsDto,
  CreateChapterDto,
  CreateTopicDto,
  UpdateChapterDto,
  UpdateTopicDto
} from './dto';
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

  @Get(':subjectId/chapters')
  @ApiOperation({ summary: 'Get chapters by subject' })
  async getChaptersBySubject(@Param('subjectId') subjectId: string) {
    return this.subjectsService.getChaptersBySubject(subjectId);
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

  // Chapter routes
  @Post('chapters')
  @RequirePermissions('subjects:create')
  @ApiOperation({ summary: 'Create new chapter' })
  @ApiResponse({ status: 201, description: 'Chapter created successfully' })
  async createChapter(@Body() createChapterDto: CreateChapterDto) {
    return this.subjectsService.createChapter(createChapterDto);
  }

  @Put('chapters/:id')
  @RequirePermissions('subjects:update')
  @ApiOperation({ summary: 'Update chapter' })
  async updateChapter(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto
  ) {
    return this.subjectsService.updateChapter(id, updateChapterDto);
  }

  @Delete('chapters/:id')
  @RequirePermissions('subjects:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete chapter' })
  async removeChapter(@Param('id') id: string) {
    await this.subjectsService.removeChapter(id);
  }

  // Topic routes
  @Post('topics')
  @RequirePermissions('subjects:create')
  @ApiOperation({ summary: 'Create new topic' })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.subjectsService.createTopic(createTopicDto);
  }

  @Get('chapters/:chapterId/topics')
  @ApiOperation({ summary: 'Get topics by chapter' })
  async getTopicsByChapter(@Param('chapterId') chapterId: string) {
    return this.subjectsService.getTopicsByChapter(chapterId);
  }

  @Put('topics/:id')
  @RequirePermissions('subjects:update')
  @ApiOperation({ summary: 'Update topic' })
  async updateTopic(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto
  ) {
    return this.subjectsService.updateTopic(id, updateTopicDto);
  }

  @Delete('topics/:id')
  @RequirePermissions('subjects:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete topic' })
  async removeTopic(@Param('id') id: string) {
    await this.subjectsService.removeTopic(id);
  }
}
