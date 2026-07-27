import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserUpdateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username!: string;

  @ApiPropertyOptional({ example: 'STF001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  staffId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
