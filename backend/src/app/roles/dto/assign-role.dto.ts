import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty()
  @IsMongoId()
  userId!: string;

  @ApiProperty()
  @IsMongoId()
  roleId!: string;
}