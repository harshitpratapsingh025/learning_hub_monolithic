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
  TestSession,
  TestSessionDocument,
  QuestionAttempt,
  QuestionAttemptDocument,
} from './schemas';
import { Question, QuestionDocument } from '../content/questions/schemas/question.schema';
import { Subject, SubjectDocument } from '../content/subjects/schemas/subject.schema';
import {
  CreatePaperDto,
  AddQuestionsDto,
  SubmitTestDto,
  QueryTestDto,
} from './dto';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(Paper.name)
    private paperModel: Model<PaperDocument>,
    @InjectModel(PaperSection.name)
    private paperSectionModel: Model<PaperSectionDocument>,
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
    if (examId) filter.examId = new Types.ObjectId(examId);
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

  // ==================== TEST SESSION OPERATIONS ====================
  async submitTest(userId: string, dto: SubmitTestDto): Promise<TestSessionDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Create test session
      const paper = await this.paperModel.findById(dto.testId);
      if (!paper) throw new NotFoundException('Paper not found');

      const totalMarks = Number(paper.totalMarks);
      const correctCount = dto.answers.filter(a => a.isCorrect).length;
      const incorrectCount = dto.answers.filter(a => !a.isCorrect && a.selectedOption).length;
      const totalAttempted = dto.answers.filter(a => a.selectedOption).length;
      const unanswered = dto.answers.length - totalAttempted;
      const timeTaken = dto.answers.reduce((sum, a) => sum + a.timeTaken, 0);
      const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

      let marksScored = 0;
      for (const answer of dto.answers) {
        if (!answer.selectedOption) continue;
        const question = await this.questionModel.findById(answer.questionId).lean();
        if (answer.isCorrect) {
          marksScored += question?.marks?.positive || 1;
        } else {
          marksScored -= question?.marks?.negative || 0.25;
        }
      }

      const testSession = new this.testSessionModel({
        userId: new Types.ObjectId(userId),
        testType: 'paper',
        testId: new Types.ObjectId(dto.testId),
        startedAt: new Date(),
        submittedAt: new Date(),
        timeTakenSeconds: timeTaken,
        status: 'submitted',
        totalAttempted,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered,
        totalMarksScored: Math.max(0, marksScored),
        totalMarksPossible: totalMarks,
        accuracyPercentage: Math.round(accuracy * 100) / 100,
      });

      const savedSession = await testSession.save({ session });

      // Insert question attempts
      const attempts = dto.answers.map(answer => ({
        session_id: savedSession._id,
        question_id: new Types.ObjectId(answer.questionId),
        selected_option_id: answer.selectedOption,
        is_correct: answer.isCorrect,
        time_spent_seconds: answer.timeTaken,
        marked_for_review: false,
        attempt_number: 1,
        attempted_at: new Date(),
      }));

      await this.questionAttemptModel.insertMany(attempts, { session });

      await session.commitTransaction();
      return savedSession;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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