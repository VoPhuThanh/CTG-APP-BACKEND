import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UserUpdateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username!: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  @IsOptional()
  password!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  roleId!: string;
}
