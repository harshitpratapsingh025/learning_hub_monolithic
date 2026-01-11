import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(
  OmitType(CreateQuestionDto, ['examId'] as const),
) {}