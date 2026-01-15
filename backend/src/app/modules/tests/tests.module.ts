import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { TestController } from './tests.controller';
import { TestService } from './tests.service';
import {
  Paper,
  PaperSchema,
  PaperQuestion,
  PaperQuestionSchema,
  TestSession,
  TestSessionSchema,
  QuestionAttempt,
  QuestionAttemptSchema,
} from './schemas';
import { Question, QuestionSchema } from '../content/questions/schemas/question.schema';
import { Subject, SubjectSchema } from '../content/subjects/schemas/subject.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Paper.name, schema: PaperSchema },
      { name: PaperQuestion.name, schema: PaperQuestionSchema },
      { name: TestSession.name, schema: TestSessionSchema },
      { name: QuestionAttempt.name, schema: QuestionAttemptSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestsModule {}
