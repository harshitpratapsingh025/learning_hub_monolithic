import { IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, IsNumber, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaperDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ example: 'SSC CGL 2024 Tier-1 Paper' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'SSC_CGL_2024_T1' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Previous Year Paper' })
  @IsString()
  @IsOptional()
  examType?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPreviousYear?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isMock?: boolean;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiPropertyOptional({ example: 'Morning' })
  @IsString()
  @IsOptional()
  shift?: string;

  @ApiPropertyOptional({ example: 'SSC' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiProperty({ example: 'SSC CGL 2024 Tier-1' })
  @IsString()
  @IsNotEmpty()
  paperName: string;

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

  @ApiPropertyOptional({ type: [String], example: ['en', 'hi'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}