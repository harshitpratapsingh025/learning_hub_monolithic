import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Admin',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Admin with all the access',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
