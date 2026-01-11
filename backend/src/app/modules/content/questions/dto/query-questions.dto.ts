import { IsOptional, IsMongoId, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryQuestionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  examId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  chapterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @ApiPropertyOptional({ example: 'mcq' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}