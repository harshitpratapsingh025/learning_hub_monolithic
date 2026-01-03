import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  question_order: number;

  @ApiPropertyOptional({ example: 'Section A' })
  @IsString()
  @IsOptional()
  section?: string;
}

export class AddQuestionsDto {
  @ApiProperty({ type: [QuestionOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[];
}