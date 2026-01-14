import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  Paper,
  PaperDocument,
  PaperSection,
  PaperSectionDocument,
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
import { Question, QuestionDocument } from '../content/questions/schemas/question.schema';
import { Subject, SubjectDocument } from '../content/subjects/schemas/subject.schema';
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
    @InjectModel(PaperSection.name)
    private paperSectionModel: Model<PaperSectionDocument>,
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
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<SubjectDocument>,
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
    await this.cacheManager.del(`papers:exam:${dto.examId}`);
    
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
      // Delete existing sections
      await this.paperSectionModel.deleteMany({ paperId: paperId }).session(session);

      // Add new sections
      const paperSections = dto.sections.map((section) => ({
        paperId: new Types.ObjectId(paperId),
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        isOptional: section.isOptional || false,
        isMandatory: section.isMandatory !== false,
        questionIds: section.questionIds.map(id => new Types.ObjectId(id)),
      }));

      await this.paperSectionModel.insertMany(paperSections, { session });
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

    const { page = 1, limit = 10, examId, isActive } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (examId) filter.examId = examId;
    if (isActive !== undefined) filter.isActive = isActive;

    const [items, total] = await Promise.all([
      this.paperModel
        .find(filter)
        .sort({ year: -1, createdAt: -1 })
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

    // Get sections with questions
    const paperSections = await this.paperSectionModel
      .find({ paperId: new Types.ObjectId(id) })
      .populate({
        path: 'questionIds',
        model: 'Question'
      })
      .lean()
      .exec();

    const result = {
      ...paper,
      sections: paperSections.map(section => ({
        sectionId: section._id,
        sectionName: section.sectionName,
        isOptional: section.isOptional,
        isMandatory: section.isMandatory,
        questions: section.questionIds
      }))
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
    await this.cacheManager.del(`papers:exam:${paper.examId}`);

    return paper;
  }

  async deletePaper(id: string): Promise<void> {
    const paper = await this.paperModel.findByIdAndDelete(id);
    
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }

    // Delete associated sections
    await this.paperSectionModel.deleteMany({ paperId: new Types.ObjectId(id) });

    // Invalidate cache
    await this.cacheManager.del(`paper:${id}`);
    await this.cacheManager.del(`papers:exam:${paper.examId}`);
  }

  // ==================== MOCK TEST OPERATIONS ====================
  async createMockTest(dto: CreateMockTestDto): Promise<MockTestDocument> {
    const mockTest = new this.mockTestModel(dto);
    const savedTest = await mockTest.save();
    
    await this.cacheManager.del(`mock-tests:exam:${dto.examId}`);
    
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
      await this.mockTestQuestionModel.deleteMany({ mockTestId: mockTestId }).session(session);

      const mockTestQuestions = dto.sections.flatMap((section) => 
        section.questionIds.map((questionId, index) => ({
          mockTestId: new Types.ObjectId(mockTestId),
          questionId: new Types.ObjectId(questionId),
          questionOrder: index + 1,
          section: section.sectionName,
        }))
      );

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

    const { page = 1, limit = 10, examId, difficulty, isActive } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (examId) filter.examId = examId;
    if (difficulty) filter.difficulty = difficulty;
    if (isActive !== undefined) filter.isActive = isActive;

    const [items, total] = await Promise.all([
      this.mockTestModel
        .find(filter)
        .sort({ createdAt: -1 })
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
      .find({ mockTestId: new Types.ObjectId(id) })
      .sort({ questionOrder: 1 })
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
    
    await this.cacheManager.del(`subject-tests:subject:${dto.subjectId}`);
    
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
      await this.subjectTestQuestionModel.deleteMany({ subjectTestId: subjectTestId }).session(session);

      const subjectTestQuestions = dto.sections.flatMap((section) => 
        section.questionIds.map((questionId, index) => ({
          subjectTestId: new Types.ObjectId(subjectTestId),
          questionId: new Types.ObjectId(questionId),
          questionOrder: index + 1,
        }))
      );

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

    const { page = 1, limit = 10, examId, subjectId, isActive } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (examId) filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (isActive !== undefined) filter.isActive = isActive;

    const [items, total] = await Promise.all([
      this.subjectTestModel
        .find(filter)
        .sort({ createdAt: -1 })
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
      .find({ subjectTestId: new Types.ObjectId(id) })
      .sort({ questionOrder: 1 })
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
      userId: userId,
      testType: dto.testType,
      testId: dto.testId,
      status: 'in_progress',
    });

    if (existingSession) {
      return existingSession;
    }

    // Get test details to set total marks
    let totalMarks = 0;
    if (dto.testType === 'paper') {
      const paper = await this.paperModel.findById(dto.testId);
      if (!paper) throw new NotFoundException('Paper not found');
      totalMarks = Number(paper.totalMarks);
    } else if (dto.testType === 'mock') {
      const mock = await this.mockTestModel.findById(dto.testId);
      if (!mock) throw new NotFoundException('Mock test not found');
      totalMarks = Number(mock.totalMarks);
    } else {
      const subject = await this.subjectTestModel.findById(dto.testId);
      if (!subject) throw new NotFoundException('Subject test not found');
      totalMarks = Number(subject.totalMarks);
    }

    const session = new this.testSessionModel({
      userId: userId,
      testType: dto.testType,
      testId: dto.testId,
      totalMarksPossible: totalMarks,
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
      question_id: dto.questionId,
    });

    if (existingAttempt) {
      // Update existing attempt
      existingAttempt.selected_option_id = dto.selectedOptionId;
      existingAttempt.marked_for_review = dto.markedForReview || false;
      existingAttempt.time_spent_seconds = dto.timeSpentSeconds;
      existingAttempt.attempt_number += 1;
      existingAttempt.attempted_at = new Date();
      await existingAttempt.save();
    } else {
      // Create new attempt
      const attempt = new this.questionAttemptModel({
        session_id: new Types.ObjectId(sessionId),
        question_id: dto.questionId,
        selected_option_id: dto.selectedOptionId,
        marked_for_review: dto.markedForReview || false,
        time_spent_seconds: dto.timeSpentSeconds,
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

    // Process each attempt
    for (const attempt of attempts) {
      if (!attempt.selected_option_id) continue;

      // Verify if the answer is correct
      const isCorrect = await this.verifyAnswer(attempt.question_id, attempt.selected_option_id);
      
      attempt.is_correct = isCorrect;

      // Get question to calculate marks
      const question = await this.questionModel.findById(attempt.question_id).lean();
      
      if (isCorrect) {
        correctCount++;
        totalMarksScored += question?.marks?.positive || 1;
      } else {
        incorrectCount++;
        totalMarksScored -= question?.marks?.negative || 0.25;
      }

      await attempt.save();
    }

    const totalAttempted = attempts.filter((a) => a.selected_option_id).length;
    const unanswered = attempts.length - totalAttempted;
    const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

    // Update session
    session.status = 'submitted';
    session.submittedAt = new Date();
    session.timeTakenSeconds = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);
    session.totalAttempted = totalAttempted;
    session.correctAnswers = correctCount;
    session.incorrectAnswers = incorrectCount;
    session.unanswered = unanswered;
    session.totalMarksScored = Math.max(0, totalMarksScored);
    session.accuracyPercentage = Math.round(accuracy * 100) / 100;

    await session.save();
    await this.cacheManager.del(`session:${sessionId}`);

    return session;
  }

  // Helper method to verify answer - implement based on your Question schema
  private async verifyAnswer(questionId: Types.ObjectId, selectedOptionId: string): Promise<boolean> {
    const question = await this.questionModel.findById(questionId).lean();
    if (!question) return false;
    
    // Check single correct option
    if (question.correctOption) {
      return question.correctOption === selectedOptionId;
    }
    
    // Check multiple correct options
    if (question.multiCorrectOptions?.length) {
      return question.multiCorrectOptions.includes(selectedOptionId);
    }
    
    return false;
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

  // ==================== RANDOM QUESTIONS ====================
  async generateRandomTest(subjectId: string, examId: string, questionCount: number, chapterId?: string) {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }
    if (!Types.ObjectId.isValid(examId)) {
      throw new BadRequestException('Invalid exam ID');
    }
    if (chapterId && !Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException('Invalid chapter ID');
    }

    const matchFilter: any = {
      subjectId: new Types.ObjectId(subjectId),
      examId: new Types.ObjectId(examId),
      isActive: true
    };

    if (chapterId) {
      matchFilter.chapterId = new Types.ObjectId(chapterId);
    }

    const [questions, subject] = await Promise.all([
      this.questionModel
        .aggregate([
          { $match: matchFilter },
          { $sample: { size: questionCount } }
        ])
        .exec(),
      this.subjectModel.findById(subjectId).select('name').lean()
    ]);

    if (questions.length === 0) {
      throw new NotFoundException('No questions found for this subject');
    }

    const subjectName = subject?.name || 'Subject';
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks?.positive || 2), 0);

    return {
      title: `${subjectName} - Random Test`,
      subjectId,
      examId,
      totalQuestions: questions.length,
      totalMarks,
      durationMinutes: questionCount * 0.8,
      sections: [
        {
          sectionId: subjectId,
          sectionName: subjectName,
          isOptional: false,
          isMandatory: true,
          questions: questions.map(q => ({
            ...q,
            id: q._id.toString(),
            subjectId: q.subjectId?.toString(),
            chapterId: q.chapterId?.toString(),
            topicId: q.topicId?.toString(),
          }))
        }
      ]
    };
  }
}