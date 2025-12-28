import { IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'questions:create' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'questions' })
  @IsString()
  resource!: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  action!: string;

  @ApiPropertyOptional({ example: 'Allows creating questions' })
  @IsString()
  description?: string;
}