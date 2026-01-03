import { IsNotEmpty, IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectTestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  exam_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  subject_id: number;

  @ApiProperty({ example: 'General Awareness - Mock 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @IsOptional()
  @Min(1)
  duration_minutes?: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  total_questions: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  total_marks: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;
}