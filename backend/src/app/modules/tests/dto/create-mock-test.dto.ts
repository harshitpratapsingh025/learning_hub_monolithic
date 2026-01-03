import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMockTestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  exam_id: number;

  @ApiProperty({ example: 'SSC CGL Full Mock Test 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsNotEmpty()
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  total_questions: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  total_marks: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;
}