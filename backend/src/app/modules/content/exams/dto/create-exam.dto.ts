import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'SSC Combined Graduate Level' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'SSC_CGL' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: 'Combined Graduate Level examination by SSC' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}