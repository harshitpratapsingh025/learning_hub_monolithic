import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TestService } from './tests.service';
import {
  CreatePaperDto,
  AddQuestionsDto,
  SubmitTestDto,
  QueryTestDto,
} from './dto';

@ApiTags('Tests')
@Controller('tests')
@ApiBearerAuth()
export class TestController {
  constructor(private readonly testService: TestService) {}

  // ==================== PAPER ENDPOINTS ====================
  @Post('papers')
  @ApiOperation({ summary: 'Create a new previous year paper' })
  @ApiResponse({ status: 201, description: 'Paper created successfully' })
  async createPaper(@Body() dto: CreatePaperDto) {
    return this.testService.createPaper(dto);
  }

  @Post('papers/:id/questions')
  @ApiOperation({ summary: 'Add questions to a paper' })
  @ApiParam({ name: 'id', description: 'Paper ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Questions added successfully' })
  async addQuestionsToPaper(
    @Param('id') id: string,
    @Body() dto: AddQuestionsDto,
  ) {
    await this.testService.addQuestionsToPaper(id, dto);
    return { message: 'Questions added successfully' };
  }

  @Get('papers')
  @ApiOperation({ summary: 'Get all papers with filters' })
  @ApiResponse({ status: 200, description: 'Papers retrieved successfully' })
  async getPapers(@Query() query: QueryTestDto) {
    return this.testService.getPapers(query);
  }

  @Get('papers/:id')
  @ApiOperation({ summary: 'Get paper by ID' })
  @ApiParam({ name: 'id', description: 'Paper ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Paper retrieved successfully' })
  async getPaperById(@Param('id') id: string) {
    return this.testService.getPaperById(id);
  }

  @Put('papers/:id')
  @ApiOperation({ summary: 'Update a paper' })
  @ApiParam({ name: 'id', description: 'Paper ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Paper updated successfully' })
  async updatePaper(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePaperDto>,
  ) {
    return this.testService.updatePaper(id, dto);
  }

  @Delete('papers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a paper' })
  @ApiParam({ name: 'id', description: 'Paper ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 204, description: 'Paper deleted successfully' })
  async deletePaper(@Param('id') id: string) {
    await this.testService.deletePaper(id);
  }

  

  // ==================== TEST SESSION ENDPOINTS ====================
  @Post('submit')
  @ApiOperation({ summary: 'Submit test with answers' })
  @ApiResponse({ status: 201, description: 'Test submitted successfully' })
  async submitTest(@Request() req, @Body() dto: SubmitTestDto) {
    return this.testService.submitTest(req.user.userId, dto);
  }


  @Get('random/:subjectId')
  @ApiOperation({ summary: 'Generate random test for subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Random test generated successfully' })
  async generateRandomTest(
    @Param('subjectId') subjectId: string,
    @Query('examId') examId: string,
    @Query('chapterId') chapterId?: string,
    @Query('count') count = '10',
  ) {
    return this.testService.generateRandomTest(subjectId, examId, Number(count), chapterId);
  }
}