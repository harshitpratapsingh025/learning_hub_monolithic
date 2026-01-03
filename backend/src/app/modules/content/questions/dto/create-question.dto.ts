import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  QuestionDifficulty,
  QuestionType,
  QuestionSource,
} from '../schemas/question.schema';

export class CreateOptionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  optionKey: string;

  @ApiProperty({ example: 'Option text in English' })
  @IsString()
  textEn: string;

  @ApiPropertyOptional({ example: 'विकल्प पाठ हिंदी में' })
  @IsOptional()
  @IsString()
  textHi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @ApiProperty()
  @IsMongoId()
  examId: string;

  @ApiProperty()
  @IsMongoId()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @ApiProperty({ enum: QuestionDifficulty })
  @IsEnum(QuestionDifficulty)
  difficulty: QuestionDifficulty;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty({ example: 'What is the capital of India?' })
  @IsString()
  questionEn: string;

  @ApiPropertyOptional({ example: 'भारत की राजधानी क्या है?' })
  @IsOptional()
  @IsString()
  questionHi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationHi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionImage?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasImage?: boolean;

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @Min(0)
  marks: number;

  @ApiProperty({ example: 0.25 })
  @IsNumber()
  @Min(0)
  negativeMarks: number;

  @ApiProperty({ enum: QuestionSource })
  @IsEnum(QuestionSource)
  createdFrom: QuestionSource;

  @ApiPropertyOptional({ example: 'SSC CGL 2021 Shift 1' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  @ApiPropertyOptional({ example: '2021' })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ type: [CreateOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}