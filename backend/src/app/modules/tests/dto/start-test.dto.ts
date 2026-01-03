import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class StartTestDto {
  @ApiProperty({ enum: ['paper', 'mock', 'subject'] })
  @IsEnum(['paper', 'mock', 'subject'])
  @IsNotEmpty()
  test_type: 'paper' | 'mock' | 'subject';

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  test_id: number;
}