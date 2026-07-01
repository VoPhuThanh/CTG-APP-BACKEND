import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PermissionUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  action!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  module!: string;
}
