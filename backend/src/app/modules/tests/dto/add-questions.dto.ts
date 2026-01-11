import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SectionDto {
  @ApiProperty({ example: 'section_1' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: 'General Intelligence and Reasoning' })
  @IsString()
  @IsNotEmpty()
  sectionName: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiProperty({ type: [String], example: ['60f1b2b3c4d5e6f7a8b9c0d1', '60f1b2b3c4d5e6f7a8b9c0d2'] })
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}

export class AddQuestionsDto {
  @ApiProperty({ type: [SectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}