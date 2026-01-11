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
  MockTest,
  MockTestSchema,
  MockTestQuestion,
  MockTestQuestionSchema,
  SubjectTest,
  SubjectTestSchema,
  SubjectTestQuestion,
  SubjectTestQuestionSchema,
  TestSession,
  TestSessionSchema,
  QuestionAttempt,
  QuestionAttemptSchema,
} from './schemas';
import { Question, QuestionSchema } from '../content/questions/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Paper.name, schema: PaperSchema },
      { name: PaperQuestion.name, schema: PaperQuestionSchema },
      { name: MockTest.name, schema: MockTestSchema },
      { name: MockTestQuestion.name, schema: MockTestQuestionSchema },
      { name: SubjectTest.name, schema: SubjectTestSchema },
      { name: SubjectTestQuestion.name, schema: SubjectTestQuestionSchema },
      { name: TestSession.name, schema: TestSessionSchema },
      { name: QuestionAttempt.name, schema: QuestionAttemptSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestsModule {}
