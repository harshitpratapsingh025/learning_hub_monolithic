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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @RequirePermissions('questions:create')
  @ApiOperation({ summary: 'Create new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get questions with filters' })
  async findAll(@Query() queryDto: QueryQuestionsDto) {
    return this.questionsService.findAll(queryDto);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random questions' })
  async findRandom(
    @Query('examId') examId: string,
    @Query('subjectId') subjectId?: string,
    @Query('count') count?: number,
  ) {
    return this.questionsService.findRandom(
      examId,
      subjectId,
      count || 10,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Get multiple questions by IDs' })
  async findByIds(@Body('questionIds') questionIds: string[]) {
    return this.questionsService.findByIds(questionIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Get(':id/check-answer')
  @ApiOperation({ summary: 'Check if answer is correct' })
  async checkAnswer(
    @Param('id') id: string,
    @Query('optionId') optionId: string,
  ) {
    return this.questionsService.checkAnswer(id, optionId);
  }

  @Put(':id')
  @RequirePermissions('questions:update')
  @ApiOperation({ summary: 'Update question' })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @RequirePermissions('questions:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.questionsService.remove(id);
  }
}
