import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { Subject, SubjectSchema, Chapter, ChapterSchema, Topic, TopicSchema } from './schemas';
import { Exam, ExamSchema } from '../exams/schemas/exam.schema';
import { CacheModule } from '../../../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Exam.name, schema: ExamSchema },
    ]),
    CacheModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}