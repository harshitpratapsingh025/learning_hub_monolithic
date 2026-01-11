import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CacheService } from '../../../cache/cache.service';
import { CreateQuestionDto, UpdateQuestionDto, QueryQuestionsDto } from './dto';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'question:';

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    // Validate ObjectIds
    if (!Types.ObjectId.isValid(createQuestionDto.examId)) {
      throw new BadRequestException('Invalid exam ID');
    }
    if (!Types.ObjectId.isValid(createQuestionDto.subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }
    if (createQuestionDto.chapterId && !Types.ObjectId.isValid(createQuestionDto.chapterId)) {
      throw new BadRequestException('Invalid chapter ID');
    }
    if (createQuestionDto.topicId && !Types.ObjectId.isValid(createQuestionDto.topicId)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const question = new this.questionModel({
      ...createQuestionDto,
      examId: new Types.ObjectId(createQuestionDto.examId),
      subjectId: new Types.ObjectId(createQuestionDto.subjectId),
      chapterId: createQuestionDto.chapterId ? new Types.ObjectId(createQuestionDto.chapterId) : undefined,
      topicId: createQuestionDto.topicId ? new Types.ObjectId(createQuestionDto.topicId) : undefined,
    });

    await question.save();

    // Invalidate related caches
    await this.invalidateRelatedCaches(question);

    this.logger.log(`Question created: ${question._id}`);

    return this.transformQuestion(question.toObject());
  }

  async findAll(queryDto: QueryQuestionsDto) {
    const { limit, offset, ...filters } = queryDto;

    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for questions list');
      return cached;
    }

    const query: any = { isActive: true };

    if (filters.examId) {
      if (!Types.ObjectId.isValid(filters.examId)) {
        throw new BadRequestException('Invalid exam ID');
      }
      query.examId = new Types.ObjectId(filters.examId);
    }

    if (filters.subjectId) {
      if (!Types.ObjectId.isValid(filters.subjectId)) {
        throw new BadRequestException('Invalid subject ID');
      }
      query.subjectId = new Types.ObjectId(filters.subjectId);
    }

    if (filters.chapterId) {
      if (!Types.ObjectId.isValid(filters.chapterId)) {
        throw new BadRequestException('Invalid chapter ID');
      }
      query.chapterId = new Types.ObjectId(filters.chapterId);
    }

    if (filters.topicId) {
      if (!Types.ObjectId.isValid(filters.topicId)) {
        throw new BadRequestException('Invalid topic ID');
      }
      query.topicId = new Types.ObjectId(filters.topicId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(query)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.questionModel.countDocuments(query),
    ]);

    const result = {
      data: questions.map((q) => this.transformQuestion(q)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Question> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID');
    }

    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get(cacheKey) as Question;

    if (cached) {
      this.logger.debug(`Cache hit for question ${id}`);
      return cached;
    }

    const question = await this.questionModel
      .findOne({ _id: id, isActive: true })
      .lean();

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const transformed = this.transformQuestion(question);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async findByIds(ids: string[]): Promise<Question[]> {
    const cacheKey = `${this.CACHE_PREFIX}bulk:${ids.sort().join(',')}`;
    const cached = await this.cacheService.get<Question[]>(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for bulk questions');
      return cached;
    }

    const objectIds = ids.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid question ID: ${id}`);
      }
      return new Types.ObjectId(id);
    });

    const questions = await this.questionModel
      .find({
        _id: { $in: objectIds },
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .lean();

    const transformed = questions.map((q) => this.transformQuestion(q));
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async findRandom(
    examId: string,
    subjectId?: string,
    count = 10,
  ): Promise<Question[]> {
    if (!Types.ObjectId.isValid(examId)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const query: any = {
      examId: new Types.ObjectId(examId),
      isActive: true,
    };

    if (subjectId) {
      if (!Types.ObjectId.isValid(subjectId)) {
        throw new BadRequestException('Invalid subject ID');
      }
      query.subjectId = new Types.ObjectId(subjectId);
    }

    const questions = await this.questionModel
      .aggregate([
        { $match: query },
        { $sample: { size: count } },
      ])
      .exec();

    return questions.map((q) => this.transformQuestion(q));
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID');
    }

    const question = await this.questionModel.findById(id);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Validate options if provided
    if (updateQuestionDto.content) {
      // Basic validation for content structure
    }
    Object.assign(question, updateQuestionDto);
    await question.save();

    // Invalidate caches
    await this.invalidateQuestionCache(id);
    await this.invalidateRelatedCaches(question);

    this.logger.log(`Question updated: ${id}`);

    return this.transformQuestion(question.toObject());
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID');
    }

    const question = await this.questionModel.findById(id);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    question.isActive = false;
    question.deletedAt = new Date();
    await question.save();

    // Invalidate caches
    await this.invalidateQuestionCache(id);
    await this.invalidateRelatedCaches(question);

    this.logger.log(`Question deleted (soft): ${id}`);
  }

  async checkAnswer(
    questionId: string,
    selectedOptionId: string,
  ): Promise<{
    isCorrect: boolean;
    correctOptionIds: string[];
    explanation?: string;
  }> {
    const question = await this.findOne(questionId);
    const correctOptionIds = question.correctOption ? [question.correctOption] : question.multiCorrectOptions || [];

    return {
      isCorrect: correctOptionIds.includes(selectedOptionId),
      correctOptionIds,
      explanation: question.solution?.en?.text,
    };
  }

  // Cache invalidation
  private async invalidateQuestionCache(id: string): Promise<void> {
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
  }

  private async invalidateRelatedCaches(question: any): Promise<void> {
    const patterns = [
      `${this.CACHE_PREFIX}list:*examId*${question.examId}*`,
      `${this.CACHE_PREFIX}list:*subjectId*${question.subjectId}*`,
      `${this.CACHE_PREFIX}bulk:*`,
    ];

    for (const pattern of patterns) {
      await this.cacheService.deletePattern(pattern);
    }
  }

  private transformQuestion(question: any): Question {
    return {
      ...question,
      id: question._id.toString(),
      examId: question.examId?.toString(),
      subjectId: question.subjectId?.toString(),
      chapterId: question.chapterId?.toString(),
      topicId: question.topicId?.toString(),
    };
  }
}