// src/modules/test/services/test.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  Paper,
  PaperDocument,
  PaperQuestion,
  PaperQuestionDocument,
  MockTest,
  MockTestDocument,
  MockTestQuestion,
  MockTestQuestionDocument,
  SubjectTest,
  SubjectTestDocument,
  SubjectTestQuestion,
  SubjectTestQuestionDocument,
  TestSession,
  TestSessionDocument,
  QuestionAttempt,
  QuestionAttemptDocument,
} from './schemas';
import {
  CreatePaperDto,
  CreateMockTestDto,
  CreateSubjectTestDto,
  AddQuestionsDto,
  StartTestDto,
  SubmitAnswerDto,
  QueryTestDto,
} from './dto';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(Paper.name)
    private paperModel: Model<PaperDocument>,
    @InjectModel(PaperQuestion.name)
    private paperQuestionModel: Model<PaperQuestionDocument>,
    @InjectModel(MockTest.name)
    private mockTestModel: Model<MockTestDocument>,
    @InjectModel(MockTestQuestion.name)
    private mockTestQuestionModel: Model<MockTestQuestionDocument>,
    @InjectModel(SubjectTest.name)
    private subjectTestModel: Model<SubjectTestDocument>,
    @InjectModel(SubjectTestQuestion.name)
    private subjectTestQuestionModel: Model<SubjectTestQuestionDocument>,
    @InjectModel(TestSession.name)
    private testSessionModel: Model<TestSessionDocument>,
    @InjectModel(QuestionAttempt.name)
    private questionAttemptModel: Model<QuestionAttemptDocument>,
    @InjectConnection()
    private connection: Connection,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ==================== PAPER OPERATIONS ====================
  async createPaper(dto: CreatePaperDto): Promise<PaperDocument> {
    const paper = new this.paperModel(dto);
    const savedPaper = await paper.save();
    
    // Invalidate cache
    await this.cacheManager.del(`papers:exam:${dto.exam_id}`);
    
    return savedPaper;
  }

  async addQuestionsToPaper(paperId: string, dto: AddQuestionsDto): Promise<void> {
    const paper = await this.paperModel.findById(paperId);
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Delete existing questions
      await this.paperQuestionModel.deleteMany({ paper_id: paperId }).session(session);

      // Add new questions
      const paperQuestions = dto.questions.map((q) => ({
        paper_id: new Types.ObjectId(paperId),
        question_id: q.question_id,
        question_order: q.question_order,
        section: q.section,
      }));

      await this.paperQuestionModel.insertMany(paperQuestions, { session });
      await session.commitTransaction();

      // Invalidate cache
      await this.cacheManager.del(`paper:${paperId}:questions`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPapers(query: QueryTestDto) {
    const cacheKey = `papers:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 10, exam_id, is_active } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (exam_id) filter.exam_id = exam_id;
    if (is_active !== undefined) filter.is_active = is_active;

    const [items, total] = await Promise.all([
      this.paperModel
        .find(filter)
        .sort({ year: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.paperModel.countDocuments(filter),
    ]);

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes
    return result;
  }

  async getPaperById(id: string) {
    const cacheKey = `paper:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const paper = await this.paperModel.findById(id).lean().exec();

    if (!paper) {
      throw new NotFoundException('Paper not found');
    }

    // Get questions for this paper
    const questions = await this.paperQuestionModel
      .find({ paper_id: new Types.ObjectId(id) })
      .sort({ question_order: 1 })
      .lean()
      .exec();

    const result = {
      ...paper,
      questions,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async updatePaper(id: string, updateData: Partial<CreatePaperDto>): Promise<PaperDocument> {
    const paper = await this.paperModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    if (!paper) {
      throw new NotFoundException('Paper not found');
    }

    // Invalidate cache
    await this.cacheManager.del(`paper:${id}`);
    await this.cacheManager.del(`papers:exam:${paper.exam_id}`);

    return paper;
  }

  async deletePaper(id: string): Promise<void> {
    const paper = await this.paperModel.findByIdAndDelete(id);
    
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }

    // Delete associated questions
    await this.paperQuestionModel.deleteMany({ paper_id: new Types.ObjectId(id) });

    // Invalidate cache
    await this.cacheManager.del(`paper:${id}`);
    await this.cacheManager.del(`papers:exam:${paper.exam_id}`);
  }

  // ==================== MOCK TEST OPERATIONS ====================
  async createMockTest(dto: CreateMockTestDto): Promise<MockTestDocument> {
    const mockTest = new this.mockTestModel(dto);
    const savedTest = await mockTest.save();
    
    await this.cacheManager.del(`mock-tests:exam:${dto.exam_id}`);
    
    return savedTest;
  }

  async addQuestionsToMockTest(mockTestId: string, dto: AddQuestionsDto): Promise<void> {
    const mockTest = await this.mockTestModel.findById(mockTestId);
    if (!mockTest) {
      throw new NotFoundException('Mock test not found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.mockTestQuestionModel.deleteMany({ mock_test_id: mockTestId }).session(session);

      const mockTestQuestions = dto.questions.map((q) => ({
        mock_test_id: new Types.ObjectId(mockTestId),
        question_id: q.question_id,
        question_order: q.question_order,
        section: q.section,
      }));

      await this.mockTestQuestionModel.insertMany(mockTestQuestions, { session });
      await session.commitTransaction();

      await this.cacheManager.del(`mock-test:${mockTestId}:questions`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getMockTests(query: QueryTestDto) {
    const cacheKey = `mock-tests:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 10, exam_id, difficulty, is_active } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (exam_id) filter.exam_id = exam_id;
    if (difficulty) filter.difficulty = difficulty;
    if (is_active !== undefined) filter.is_active = is_active;

    const [items, total] = await Promise.all([
      this.mockTestModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.mockTestModel.countDocuments(filter),
    ]);

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async getMockTestById(id: string) {
    const cacheKey = `mock-test:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const mockTest = await this.mockTestModel.findById(id).lean().exec();

    if (!mockTest) {
      throw new NotFoundException('Mock test not found');
    }

    const questions = await this.mockTestQuestionModel
      .find({ mock_test_id: new Types.ObjectId(id) })
      .sort({ question_order: 1 })
      .lean()
      .exec();

    const result = {
      ...mockTest,
      questions,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  // ==================== SUBJECT TEST OPERATIONS ====================
  async createSubjectTest(dto: CreateSubjectTestDto): Promise<SubjectTestDocument> {
    const subjectTest = new this.subjectTestModel(dto);
    const savedTest = await subjectTest.save();
    
    await this.cacheManager.del(`subject-tests:subject:${dto.subject_id}`);
    
    return savedTest;
  }

  async addQuestionsToSubjectTest(subjectTestId: string, dto: AddQuestionsDto): Promise<void> {
    const subjectTest = await this.subjectTestModel.findById(subjectTestId);
    if (!subjectTest) {
      throw new NotFoundException('Subject test not found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.subjectTestQuestionModel.deleteMany({ subject_test_id: subjectTestId }).session(session);

      const subjectTestQuestions = dto.questions.map((q) => ({
        subject_test_id: new Types.ObjectId(subjectTestId),
        question_id: q.question_id,
        question_order: q.question_order,
      }));

      await this.subjectTestQuestionModel.insertMany(subjectTestQuestions, { session });
      await session.commitTransaction();

      await this.cacheManager.del(`subject-test:${subjectTestId}:questions`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getSubjectTests(query: QueryTestDto) {
    const cacheKey = `subject-tests:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 10, exam_id, subject_id, is_active } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (exam_id) filter.exam_id = exam_id;
    if (subject_id) filter.subject_id = subject_id;
    if (is_active !== undefined) filter.is_active = is_active;

    const [items, total] = await Promise.all([
      this.subjectTestModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.subjectTestModel.countDocuments(filter),
    ]);

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async getSubjectTestById(id: string) {
    const cacheKey = `subject-test:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const subjectTest = await this.subjectTestModel.findById(id).lean().exec();

    if (!subjectTest) {
      throw new NotFoundException('Subject test not found');
    }

    const questions = await this.subjectTestQuestionModel
      .find({ subject_test_id: new Types.ObjectId(id) })
      .sort({ question_order: 1 })
      .lean()
      .exec();

    const result = {
      ...subjectTest,
      questions,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  // ==================== TEST SESSION OPERATIONS ====================
  async startTest(userId: string, dto: StartTestDto): Promise<TestSessionDocument> {
    // Check for existing in-progress session
    const existingSession = await this.testSessionModel.findOne({
      user_id: userId,
      test_type: dto.test_type,
      test_id: dto.test_id,
      status: 'in_progress',
    });

    if (existingSession) {
      return existingSession;
    }

    // Get test details to set total marks
    let totalMarks = 0;
    if (dto.test_type === 'paper') {
      const paper = await this.paperModel.findById(dto.test_id);
      if (!paper) throw new NotFoundException('Paper not found');
      totalMarks = Number(paper.total_marks);
    } else if (dto.test_type === 'mock') {
      const mock = await this.mockTestModel.findById(dto.test_id);
      if (!mock) throw new NotFoundException('Mock test not found');
      totalMarks = Number(mock.total_marks);
    } else {
      const subject = await this.subjectTestModel.findById(dto.test_id);
      if (!subject) throw new NotFoundException('Subject test not found');
      totalMarks = Number(subject.total_marks);
    }

    const session = new this.testSessionModel({
      user_id: userId,
      test_type: dto.test_type,
      test_id: dto.test_id,
      total_marks_possible: totalMarks,
    });

    return await session.save();
  }

  async submitAnswer(sessionId: string, dto: SubmitAnswerDto): Promise<void> {
    const session = await this.testSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Test has already been submitted');
    }

    // Check if answer already exists
    const existingAttempt = await this.questionAttemptModel.findOne({
      session_id: new Types.ObjectId(sessionId),
      question_id: dto.question_id,
    });

    if (existingAttempt) {
      // Update existing attempt
      existingAttempt.selected_option_id = dto.selected_option_id;
      existingAttempt.marked_for_review = dto.marked_for_review || false;
      existingAttempt.time_spent_seconds = dto.time_spent_seconds;
      existingAttempt.attempt_number += 1;
      existingAttempt.attempted_at = new Date();
      await existingAttempt.save();
    } else {
      // Create new attempt
      const attempt = new this.questionAttemptModel({
        session_id: new Types.ObjectId(sessionId),
        question_id: dto.question_id,
        selected_option_id: dto.selected_option_id,
        marked_for_review: dto.marked_for_review || false,
        time_spent_seconds: dto.time_spent_seconds,
      });
      await attempt.save();
    }

    // Clear session cache
    await this.cacheManager.del(`session:${sessionId}`);
  }

  async submitTest(sessionId: string): Promise<TestSessionDocument> {
    const session = await this.testSessionModel.findById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Test has already been submitted');
    }

    // Get all attempts for this session
    const attempts = await this.questionAttemptModel.find({
      session_id: new Types.ObjectId(sessionId),
    });

    let correctCount = 0;
    let incorrectCount = 0;
    let totalMarksScored = 0;

    // You'll need to fetch questions from your Question service/model
    // This is a simplified version - adjust based on your Question schema
    const questionIds = attempts.map((a) => a.question_id);
    
    // Assuming you have access to questions - adjust this based on your implementation
    // For now, using a placeholder calculation
    for (const attempt of attempts) {
      if (!attempt.selected_option_id) continue;

      // You need to verify if the answer is correct by checking against the Question model
      // This is placeholder logic - implement based on your Question schema
      const isCorrect = await this.verifyAnswer(attempt.question_id, attempt.selected_option_id);
      
      attempt.is_correct = isCorrect;

      if (isCorrect) {
        correctCount++;
        totalMarksScored += 1; // Default marks - adjust based on question
      } else {
        incorrectCount++;
        totalMarksScored -= 0.25; // Default negative marks - adjust based on question
      }

      await attempt.save();
    }

    const totalAttempted = attempts.filter((a) => a.selected_option_id).length;
    const unanswered = attempts.length - totalAttempted;
    const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

    // Update session
    session.status = 'submitted';
    session.submitted_at = new Date();
    session.time_taken_seconds = Math.floor((new Date().getTime() - session.started_at.getTime()) / 1000);
    session.total_attempted = totalAttempted;
    session.correct_answers = correctCount;
    session.incorrect_answers = incorrectCount;
    session.unanswered = unanswered;
    session.total_marks_scored = Math.max(0, totalMarksScored);
    session.accuracy_percentage = Math.round(accuracy * 100) / 100;

    await session.save();
    await this.cacheManager.del(`session:${sessionId}`);

    return session;
  }

  // Helper method to verify answer - implement based on your Question schema
  private async verifyAnswer(questionId: number, selectedOptionId: number): Promise<boolean> {
    // This should query your Question/Option schema to check if the selected option is correct
    // Placeholder implementation - adjust based on your actual schema
    return true;
  }

  async getSessionDetails(sessionId: string) {
    const cacheKey = `session:${sessionId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const session = await this.testSessionModel.findById(sessionId).lean().exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const attempts = await this.questionAttemptModel
      .find({ session_id: new Types.ObjectId(sessionId) })
      .lean()
      .exec();

    const result = {
      ...session,
      attempts,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }
}