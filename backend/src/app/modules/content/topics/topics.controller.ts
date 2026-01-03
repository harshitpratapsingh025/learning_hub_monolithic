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
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { QueryTopicsDto } from './dto/query-topics.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Topics')
@ApiBearerAuth()
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @RequirePermissions('topics:create')
  @ApiOperation({ summary: 'Create new topic' })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  async create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  async findAll(@Query() queryDto: QueryTopicsDto) {
    return this.topicsService.findAll(queryDto);
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get topics by subject' })
  async findBySubject(@Param('subjectId') subjectId: string) {
    return this.topicsService.findBySubject(subjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('topics:update')
  @ApiOperation({ summary: 'Update topic' })
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @RequirePermissions('topics:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete topic' })
  async remove(@Param('id') id: string) {
    await this.topicsService.remove(id);
  }
}