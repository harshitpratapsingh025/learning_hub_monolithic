import { IsString, IsOptional, IsInt, IsMongoId, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty()
  @IsMongoId()
  examId!: string;

  @ApiProperty({ example: 'General Intelligence and Reasoning' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Reasoning and logical thinking' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}