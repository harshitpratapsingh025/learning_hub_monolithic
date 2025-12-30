import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ExamsModule } from './exams/exams.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  imports: [ExamsModule, SubjectsModule, TopicsModule]
})
export class ContentModule {}
