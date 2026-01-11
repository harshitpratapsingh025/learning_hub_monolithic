import { IsString, IsOptional, IsInt, IsMongoId, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChapterDto {
  @ApiProperty()
  @IsMongoId()
  subjectId!: string;

  @ApiProperty({ example: 'Algebra' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Basic algebraic concepts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Alg' })
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional({ example: '🔢' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}