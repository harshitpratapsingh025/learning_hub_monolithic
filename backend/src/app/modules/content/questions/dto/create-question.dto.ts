import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsArray,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarksDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  positive!: number;

  @ApiProperty({ example: 0.25 })
  @IsNumber()
  negative!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  partial?: number;
}

export class CreateSolutionDto {
  @ApiPropertyOptional({ example: 'Detailed explanation here' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'tb' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class CreateQuestionContentDto {
  @ApiProperty({ example: 'What is the capital of India?' })
  @IsString()
  question!: string;

  @ApiProperty({ example: [] })
  @IsArray()
  options!: any[];

  @ApiPropertyOptional({ example: 'New Delhi is the capital' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'Read the passage and answer the question' })
  @IsOptional()
  @IsString()
  comprehension?: string;
}

export class CreateQuestionDto {
  @ApiProperty()
  @IsMongoId()
  examId!: string;

  @ApiProperty()
  @IsMongoId()
  subjectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  chapterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @ApiProperty({ example: 'mcq' })
  @IsString()
  type!: string;

  @ApiProperty({ type: CreateMarksDto })
  @ValidateNested()
  @Type(() => CreateMarksDto)
  marks!: CreateMarksDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  content!: {
    en: CreateQuestionContentDto;
    hn?: CreateQuestionContentDto;
  };

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasImage?: boolean;

  @ApiPropertyOptional({ example: 'B' })
  @IsOptional()
  @IsString()
  correctOption?: string;

  @ApiPropertyOptional({ example: ['A', 'B'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  multiCorrectOptions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  range?: {
    start: string;
    end: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  solution?: {
    en?: CreateSolutionDto;
    hn?: CreateSolutionDto;
  };

  @ApiPropertyOptional({ example: ['reasoning', 'logic'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}