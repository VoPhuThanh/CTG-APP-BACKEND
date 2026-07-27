import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class SiteSettingCreateDto {
  @ApiProperty({
    example: 'site.name',
    description:
      'Stable setting key. Use lowercase letters, numbers, dots, underscores, or hyphens.',
  })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
    message:
      'key must use lowercase words separated by dots, underscores, or hyphens',
  })
  key!: string;

  @ApiProperty({ example: 'general' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
    message:
      'group must use lowercase words separated by dots, underscores, or hyphens',
  })
  group!: string;

  @ApiProperty({ example: 'Site Name' })
  @IsString()
  @MaxLength(150)
  labelEn!: string;

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
      'Scalar value. Required for non-media types. Media-asset settings may retain a legacy URL fallback during transition.',
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Managed image selection for valueType=media_asset.',
  })
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string | null;

  @ApiPropertyOptional({
    enum: SiteSettingValueType,
    default: SiteSettingValueType.TEXT,
  })
  @IsOptional()
  @IsEnum(SiteSettingValueType)
  valueType?: SiteSettingValueType;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;
}
