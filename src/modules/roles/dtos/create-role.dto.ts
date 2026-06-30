import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RoleCreateDto {
  @ApiPropertyOptional()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description!: string;

  @ApiPropertyOptional()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  permissionId!: string[];
}
