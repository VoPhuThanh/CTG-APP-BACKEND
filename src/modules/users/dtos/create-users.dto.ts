import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class UserCreateDto {
  @ApiPropertyOptional()
  @IsString()
  username!: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional()
  @IsUUID()
  roleId!: string;
}
