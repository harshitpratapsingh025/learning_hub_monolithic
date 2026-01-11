import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { CacheModule } from '../../../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exam.name, schema: ExamSchema }]),
    CacheModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
