import { IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaperDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  exam_id: number;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiPropertyOptional({ example: 'Morning' })
  @IsString()
  @IsOptional()
  shift?: string;

  @ApiProperty({ example: 'SSC CGL 2024 Tier-1' })
  @IsString()
  @IsNotEmpty()
  paper_name: string;

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
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}