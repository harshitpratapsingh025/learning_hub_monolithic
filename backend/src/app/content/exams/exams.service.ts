import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './schemas';
import { CacheService } from '../../cache/cache.service';
import { CreateExamDto, UpdateExamDto, QueryExamsDto } from './dto';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);
  private readonly CACHE_TTL = 7200; // 2 hours (exams change less frequently)
  private readonly CACHE_PREFIX = 'exam:';

  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    private readonly cacheService: CacheService
  ) {}

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    // Check if exam exists
    const existingExam = await this.examModel.findOne({
      $or: [{ name: createExamDto.name }, { code: createExamDto.code }],
    });

    if (existingExam) {
      throw new ConflictException('Exam name or code already exists');
    }

    const exam = new this.examModel(createExamDto);
    await exam.save();

    // Invalidate cache
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);

    this.logger.log(`Exam created: ${exam.name}`);

    return this.transformExam(exam.toObject());
  }

  async findAll(queryDto: QueryExamsDto) {
    const { search, isActive, limit = 50, offset = 0 } = queryDto;

    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for exams list');
      return cached;
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [exams, total] = await Promise.all([
      this.examModel
        .find(query)
        .skip(offset)
        .limit(limit)
        .sort({ name: 1 })
        .lean(),
      this.examModel.countDocuments(query),
    ]);

    const result = {
      data: exams.map((exam) => this.transformExam(exam)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get(cacheKey) as Exam;

    if (cached) {
      this.logger.debug(`Cache hit for exam ${id}`);
      return cached;
    }

    const exam = await this.examModel.findById(id).lean();

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const transformed = this.transformExam(exam);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async findByCode(code: string): Promise<Exam> {
    const cacheKey = `${this.CACHE_PREFIX}code:${code}`;
    const cached = await this.cacheService.get(cacheKey) as Exam;

    if (cached) {
      return cached;
    }

    const exam = await this.examModel.findOne({ code, isActive: true }).lean();

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const transformed = this.transformExam(exam);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel.findById(id);

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check uniqueness if name or code is being updated
    if (updateExamDto.name || updateExamDto.code) {
      const existingExam = await this.examModel.findOne({
        $or: [
          ...(updateExamDto.name ? [{ name: updateExamDto.name }] : []),
          ...(updateExamDto.code ? [{ code: updateExamDto.code }] : []),
        ],
        _id: { $ne: id },
      });

      if (existingExam) {
        throw new ConflictException('Exam name or code already exists');
      }
    }

    Object.assign(exam, updateExamDto);
    await exam.save();

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.delete(`${this.CACHE_PREFIX}code:${exam.code}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);

    this.logger.log(`Exam updated: ${id}`);

    return this.transformExam(exam.toObject());
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel.findById(id);

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    exam.isActive = false;
    await exam.save();

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.delete(`${this.CACHE_PREFIX}code:${exam.code}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);

    this.logger.log(`Exam deleted (soft): ${id}`);
  }

  private transformExam(exam: any): Exam {
    return {
      ...exam,
      id: exam._id.toString(),
    };
  }
}
