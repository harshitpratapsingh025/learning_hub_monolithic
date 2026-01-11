import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, IsNumber, Min, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMockTestDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ example: 'SSC CGL Full Mock Test 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SSC CGL Full Mock Test 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'MOCK_001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Mock Test' })
  @IsString()
  @IsOptional()
  examType?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPreviousYear?: boolean;

  @ApiPropertyOptional({ example: '2024' })
  @IsString()
  @IsOptional()
  year?: string;

  @ApiPropertyOptional({ example: 'Morning' })
  @IsString()
  @IsOptional()
  shift?: string;

  @ApiPropertyOptional({ example: 'SSC' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsNotEmpty()
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  sectionTimeShared?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isSectionalSubmit?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  showCalculator?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['en'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}