import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionAnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  selectedOption: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: 45 })
  @IsInt()
  timeTaken: number;
}

export class SubmitTestDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({ example: 'SSC CGL 2024 Tier-1 Paper' })
  @IsString()
  @IsNotEmpty()
  testTitle: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ type: [QuestionAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];
}