import { IsString, IsOptional, IsInt, IsMongoId, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty()
  @IsMongoId()
  chapterId!: string;

  @ApiProperty({ example: 'Linear Equations' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Solving linear equations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'LinEq' })
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional({ example: '📐' })
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