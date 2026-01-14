import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Topic, TopicDocument } from './schemas/topic.schema';
import { Exam, ExamDocument } from '../exams/schemas/exam.schema';
import { CacheService } from '../../../cache/cache.service';
import { 
  CreateSubjectDto, 
  UpdateSubjectDto, 
  QuerySubjectsDto,
  CreateChapterDto,
  CreateTopicDto,
  UpdateChapterDto,
  UpdateTopicDto
} from './dto';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'subject:';

  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    // Verify exam exists
    if (!Types.ObjectId.isValid(createSubjectDto.examId)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel.findById(createSubjectDto.examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if subject already exists for this exam
    const existingSubject = await this.subjectModel.findOne({
      examId: new Types.ObjectId(createSubjectDto.examId),
      name: createSubjectDto.name,
    });

    if (existingSubject) {
      throw new ConflictException('Subject already exists for this exam');
    }

    const subject = new this.subjectModel({
      ...createSubjectDto,
      examId: new Types.ObjectId(createSubjectDto.examId),
    });

    await subject.save();

    // Invalidate cache
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(`exam:${createSubjectDto.examId}:subjects`);

    this.logger.log(`Subject created: ${subject.name}`);

    return this.transformSubject(subject.toObject());
  }

  async findAll(queryDto: QuerySubjectsDto) {
    const { examId, search, limit = 50, offset = 0 } = queryDto;

    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for subjects list');
      return cached;
    }

    const query: any = {};

    if (examId) {
      if (!Types.ObjectId.isValid(examId)) {
        throw new BadRequestException('Invalid exam ID');
      }
      query.examId = new Types.ObjectId(examId);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      this.subjectModel
        .find(query)
        .populate('examId')
        .skip(offset)
        .limit(limit)
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      this.subjectModel.countDocuments(query),
    ]);

    const result = {
      data: subjects.map((subject) => this.transformSubject(subject)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Subject> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get(cacheKey) as Subject;

    if (cached) {
      this.logger.debug(`Cache hit for subject ${id}`);
      return cached;
    }

    const subject = await this.subjectModel
      .findById(id)
      .populate('examId')
      .lean();

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const chapters = await this.chapterModel
      .find({ subjectId: new Types.ObjectId(id), isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const transformed = {
      ...this.transformSubject(subject),
      chapters: chapters.map(chapter => this.transformChapter(chapter))
    };
    
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async findByExam(examId: string): Promise<Subject[]> {
    if (!Types.ObjectId.isValid(examId)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const cacheKey = `exam:${examId}:subjects`;
    const cached = await this.cacheService.get<Subject[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for exam ${examId} subjects`);
      return cached;
    }

    const subjects = await this.subjectModel
      .find({ examId: new Types.ObjectId(examId) })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const transformed = subjects.map((subject) => this.transformSubject(subject));
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(id);

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check uniqueness if name is being updated
    if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
      const existingSubject = await this.subjectModel.findOne({
        examId: subject.examId,
        name: updateSubjectDto.name,
        _id: { $ne: id },
      });

      if (existingSubject) {
        throw new ConflictException('Subject name already exists for this exam');
      }
    }

    Object.assign(subject, updateSubjectDto);
    await subject.save();

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(`exam:${subject.examId}:subjects`);

    this.logger.log(`Subject updated: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(id);

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.subjectModel.findByIdAndDelete(id);

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(`exam:${subject.examId}:subjects`);

    this.logger.log(`Subject deleted: ${id}`);
  }

  private transformSubject(subject: any): Subject {
    return {
      ...subject,
      id: subject._id.toString(),
      examId: subject.examId?.toString() || subject.examId,
    };
  }

  // Chapter methods
  async createChapter(createChapterDto: CreateChapterDto) {
    if (!Types.ObjectId.isValid(createChapterDto.subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(createChapterDto.subjectId);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const chapter = new this.chapterModel({
      ...createChapterDto,
      subjectId: new Types.ObjectId(createChapterDto.subjectId),
    });

    await chapter.save();
    this.logger.log(`Chapter created: ${chapter.name}`);
    return this.transformChapter(chapter.toObject());
  }

  async getChaptersBySubject(subjectId: string) {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const chapters = await this.chapterModel
      .find({ subjectId: new Types.ObjectId(subjectId), isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return chapters.map(chapter => this.transformChapter(chapter));
  }

  async updateChapter(id: string, updateChapterDto: UpdateChapterDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chapter ID');
    }

    const chapter = await this.chapterModel.findByIdAndUpdate(
      id,
      updateChapterDto,
      { new: true }
    );

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    this.logger.log(`Chapter updated: ${id}`);
    return this.transformChapter(chapter.toObject());
  }

  async removeChapter(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chapter ID');
    }

    const chapter = await this.chapterModel.findByIdAndDelete(id);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    this.logger.log(`Chapter deleted: ${id}`);
  }

  // Topic methods
  async createTopic(createTopicDto: CreateTopicDto) {
    if (!Types.ObjectId.isValid(createTopicDto.chapterId)) {
      throw new BadRequestException('Invalid chapter ID');
    }

    const chapter = await this.chapterModel.findById(createTopicDto.chapterId);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const topic = new this.topicModel({
      ...createTopicDto,
      chapterId: new Types.ObjectId(createTopicDto.chapterId),
    });

    await topic.save();
    this.logger.log(`Topic created: ${topic.name}`);
    return this.transformTopic(topic.toObject());
  }

  async getTopicsByChapter(chapterId: string) {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException('Invalid chapter ID');
    }

    const topics = await this.topicModel
      .find({ chapterId: new Types.ObjectId(chapterId) })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return topics.map(topic => this.transformTopic(topic));
  }

  async updateTopic(id: string, updateTopicDto: UpdateTopicDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const topic = await this.topicModel.findByIdAndUpdate(
      id,
      updateTopicDto,
      { new: true }
    );

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    this.logger.log(`Topic updated: ${id}`);
    return this.transformTopic(topic.toObject());
  }

  async removeTopic(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const topic = await this.topicModel.findByIdAndDelete(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    this.logger.log(`Topic deleted: ${id}`);
  }

  private transformChapter(chapter: any) {
    return {
      ...chapter,
      id: chapter._id.toString(),
      subjectId: chapter.subjectId?.toString() || chapter.subjectId,
    };
  }

  private transformTopic(topic: any) {
    return {
      ...topic,
      id: topic._id.toString(),
      chapterId: topic.chapterId?.toString() || topic.chapterId,
    };
  }
}