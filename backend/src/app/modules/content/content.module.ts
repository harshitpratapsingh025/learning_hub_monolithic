import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ExamsModule } from './exams/exams.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  imports: [ExamsModule, SubjectsModule, QuestionsModule]
})
export class ContentModule {}
