import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class StartTestDto {
  @ApiProperty({ enum: ['paper', 'mock', 'subject'] })
  @IsEnum(['paper', 'mock', 'subject'])
  @IsNotEmpty()
  testType: 'paper' | 'mock' | 'subject';

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  testId: string;
}