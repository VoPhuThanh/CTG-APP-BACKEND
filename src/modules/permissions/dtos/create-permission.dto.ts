import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PermissionCreateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description!: string;

  @ApiProperty()
  @IsString()
  module!: string;

  @ApiProperty()
  @IsString()
  action!: string;
}
