import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
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

  @ApiPropertyOptional({ example: 'CTG Fitness' })
  @IsOptional()
  @IsString()
  value?: string;

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

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
