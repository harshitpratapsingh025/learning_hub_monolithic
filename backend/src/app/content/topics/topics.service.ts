import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic, TopicDocument } from './schemas/topic.schema';
import { Subject, SubjectDocument } from '../subjects/schemas/subject.schema';
import { CacheService } from '../../cache/cache.service';
import {
  CreateTopicDto,
  UpdateTopicDto,
  QueryTopicsDto,
} from './dto';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'topic:';

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    private readonly cacheService: CacheService
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    // Verify subject exists
    if (!Types.ObjectId.isValid(createTopicDto.subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(createTopicDto.subjectId);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if topic already exists for this subject
    const existingTopic = await this.topicModel.findOne({
      subjectId: new Types.ObjectId(createTopicDto.subjectId),
      name: createTopicDto.name,
    });

    if (existingTopic) {
      throw new ConflictException('Topic already exists for this subject');
    }

    const topic = new this.topicModel({
      ...createTopicDto,
      subjectId: new Types.ObjectId(createTopicDto.subjectId),
    });

    await topic.save();

    // Invalidate cache
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(
      `subject:${createTopicDto.subjectId}:topics`
    );

    this.logger.log(`Topic created: ${topic.name}`);

    return this.transformTopic(topic.toObject());
  }

  async findAll(queryDto: QueryTopicsDto) {
    const { subjectId, search, limit = 100, offset = 0 } = queryDto;

    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for topics list');
      return cached;
    }

    const query: any = {};

    if (subjectId) {
      if (!Types.ObjectId.isValid(subjectId)) {
        throw new BadRequestException('Invalid subject ID');
      }
      query.subjectId = new Types.ObjectId(subjectId);
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [topics, total] = await Promise.all([
      this.topicModel
        .find(query)
        .populate('subjectId')
        .skip(offset)
        .limit(limit)
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      this.topicModel.countDocuments(query),
    ]);

    const result = {
      data: topics.map((topic) => this.transformTopic(topic)),
      total,
      limit,
      offset,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<Topic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = (await this.cacheService.get(cacheKey)) as Topic;

    if (cached) {
      this.logger.debug(`Cache hit for topic ${id}`);
      return cached;
    }

    const topic = await this.topicModel
      .findById(id)
      .populate('subjectId')
      .lean();

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const transformed = this.transformTopic(topic);
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async findBySubject(subjectId: string): Promise<Topic[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const cacheKey = `subject:${subjectId}:topics`;
    const cached = await this.cacheService.get<Topic[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for subject ${subjectId} topics`);
      return cached;
    }

    const topics = await this.topicModel
      .find({ subjectId: new Types.ObjectId(subjectId) })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const transformed = topics.map((topic) => this.transformTopic(topic));
    await this.cacheService.set(cacheKey, transformed, this.CACHE_TTL);

    return transformed;
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const topic = await this.topicModel.findById(id);

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check uniqueness if name is being updated
    if (updateTopicDto.name && updateTopicDto.name !== topic.name) {
      const existingTopic = await this.topicModel.findOne({
        subjectId: topic.subjectId,
        name: updateTopicDto.name,
        _id: { $ne: id },
      });

      if (existingTopic) {
        throw new ConflictException(
          'Topic name already exists for this subject'
        );
      }
    }

    Object.assign(topic, updateTopicDto);
    await topic.save();

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(`subject:${topic.subjectId}:topics`);

    this.logger.log(`Topic updated: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid topic ID');
    }

    const topic = await this.topicModel.findById(id);

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    await this.topicModel.findByIdAndDelete(id);

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
    await this.cacheService.deletePattern(`subject:${topic.subjectId}:topics`);

    this.logger.log(`Topic deleted: ${id}`);
  }

  private transformTopic(topic: any): Topic {
    return {
      ...topic,
      id: topic._id.toString(),
      subjectId: topic.subjectId?.toString() || topic.subjectId,
    };
  }
}
