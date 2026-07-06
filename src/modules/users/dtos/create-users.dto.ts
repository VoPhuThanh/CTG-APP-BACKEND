import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UserCreateDto {
  @ApiProperty({ example: 'STF001' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiPropertyOptional()
  @IsString()
  username!: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  roleId!: string;
}
