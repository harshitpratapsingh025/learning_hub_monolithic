import { IsNotEmpty, IsString, IsInt, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectTestDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'General Awareness - Mock 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @IsOptional()
  @Min(1)
  durationMinutes?: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}