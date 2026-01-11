import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';
import { CreateTopicDto } from './create-topic.dto';

export class UpdateChapterDto extends PartialType(
  OmitType(CreateChapterDto, ['subjectId'] as const),
) {}

export class UpdateTopicDto extends PartialType(
  OmitType(CreateTopicDto, ['chapterId'] as const),
) {}