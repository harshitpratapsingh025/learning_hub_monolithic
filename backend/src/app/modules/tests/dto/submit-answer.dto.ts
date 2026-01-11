import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  markedForReview?: boolean;

  @ApiPropertyOptional({ example: 45 })
  @IsInt()
  @IsOptional()
  timeSpentSeconds?: number;
}