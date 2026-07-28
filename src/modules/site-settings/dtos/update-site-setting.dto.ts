import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { SiteSettingValueType } from '../enums/site-setting.enum';

export class SiteSettingUpdateDto {
  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
    message:
      'group must use lowercase words separated by dots, underscores, or hyphens',
  })
  group?: string;

  @ApiPropertyOptional({ example: 'Site Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  labelEn?: string;

  @ApiPropertyOptional({ example: 'Tên trang' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  labelVi?: string;

  @ApiPropertyOptional({ example: 'Main public website name.' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'Tên chính của website công khai.' })
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({
    example: 'CTG Fitness',
    nullable: true,
    description:
      'For media_asset settings, an optional public URL retained as the legacy fallback.',
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string | null;

  @ApiPropertyOptional({ enum: SiteSettingValueType })
  @IsOptional()
  @IsEnum(SiteSettingValueType)
  valueType?: SiteSettingValueType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;
}
