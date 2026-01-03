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
  CreateMockTestDto,
  CreateSubjectTestDto,
  AddQuestionsDto,
  StartTestDto,
  SubmitAnswerDto,
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

  

  // ==================== MOCK TEST ENDPOINTS ====================
  @Post('mock-tests')
  @ApiOperation({ summary: 'Create a new mock test' })
  @ApiResponse({ status: 201, description: 'Mock test created successfully' })
  async createMockTest(@Body() dto: CreateMockTestDto) {
    return this.testService.createMockTest(dto);
  }

  @Post('mock-tests/:id/questions')
  @ApiOperation({ summary: 'Add questions to a mock test' })
  @ApiParam({ name: 'id', description: 'Mock Test ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Questions added successfully' })
  async addQuestionsToMockTest(
    @Param('id') id: string,
    @Body() dto: AddQuestionsDto,
  ) {
    await this.testService.addQuestionsToMockTest(id, dto);
    return { message: 'Questions added successfully' };
  }

  @Get('mock-tests')
  @ApiOperation({ summary: 'Get all mock tests with filters' })
  @ApiResponse({ status: 200, description: 'Mock tests retrieved successfully' })
  async getMockTests(@Query() query: QueryTestDto) {
    return this.testService.getMockTests(query);
  }

  @Get('mock-tests/:id')
  @ApiOperation({ summary: 'Get mock test by ID' })
  @ApiParam({ name: 'id', description: 'Mock Test ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Mock test retrieved successfully' })
  async getMockTestById(@Param('id') id: string) {
    return this.testService.getMockTestById(id);
  }



  // ==================== SUBJECT TEST ENDPOINTS ====================
  @Post('subject-tests')
  @ApiOperation({ summary: 'Create a new subject test' })
  @ApiResponse({ status: 201, description: 'Subject test created successfully' })
  async createSubjectTest(@Body() dto: CreateSubjectTestDto) {
    return this.testService.createSubjectTest(dto);
  }

  @Post('subject-tests/:id/questions')
  @ApiOperation({ summary: 'Add questions to a subject test' })
  @ApiParam({ name: 'id', description: 'Subject Test ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Questions added successfully' })
  async addQuestionsToSubjectTest(
    @Param('id') id: string,
    @Body() dto: AddQuestionsDto,
  ) {
    await this.testService.addQuestionsToSubjectTest(id, dto);
    return { message: 'Questions added successfully' };
  }

  @Get('subject-tests')
  @ApiOperation({ summary: 'Get all subject tests with filters' })
  @ApiResponse({ status: 200, description: 'Subject tests retrieved successfully' })
  async getSubjectTests(@Query() query: QueryTestDto) {
    return this.testService.getSubjectTests(query);
  }

  @Get('subject-tests/:id')
  @ApiOperation({ summary: 'Get subject test by ID' })
  @ApiParam({ name: 'id', description: 'Subject Test ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Subject test retrieved successfully' })
  async getSubjectTestById(@Param('id') id: string) {
    return this.testService.getSubjectTestById(id);
  }

  // ==================== TEST SESSION ENDPOINTS ====================
  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a test session' })
  @ApiResponse({ status: 201, description: 'Test session started successfully' })
  async startTest(@Request() req, @Body() dto: StartTestDto) {
    return this.testService.startTest(req.user.userId, dto);
  }

  @Post('sessions/:sessionId/submit-answer')
  @ApiOperation({ summary: 'Submit answer for a question in a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Answer submitted successfully' })
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    await this.testService.submitAnswer(sessionId, dto);
    return { message: 'Answer submitted successfully' };
  }

  @Post('sessions/:sessionId/submit')
  @ApiOperation({ summary: 'Submit the entire test' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Test submitted successfully' })
  async submitTest(@Param('sessionId') sessionId: string) {
    return this.testService.submitTest(sessionId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get test session details' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Session details retrieved successfully' })
  async getSessionDetails(@Param('sessionId') sessionId: string) {
    return this.testService.getSessionDetails(sessionId);
  }
}