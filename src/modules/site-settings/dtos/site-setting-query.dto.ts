import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { SiteSettingValueType } from '../enums/site-setting.enum';

export class SiteSettingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ enum: SiteSettingValueType })
  @IsOptional()
  @IsEnum(SiteSettingValueType)
  valueType?: SiteSettingValueType;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isPublic?: 'true' | 'false';

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isEditable?: 'true' | 'false';
}
