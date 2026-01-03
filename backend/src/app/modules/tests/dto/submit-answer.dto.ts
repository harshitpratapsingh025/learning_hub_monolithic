import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  selected_option_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  marked_for_review?: boolean;

  @ApiPropertyOptional({ example: 45 })
  @IsInt()
  @IsOptional()
  time_spent_seconds?: number;
}