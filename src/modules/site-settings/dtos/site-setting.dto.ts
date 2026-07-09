import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SiteSettingValueType } from '../enums/site-setting.enum';

export class SiteSettingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  group!: string;

  @ApiProperty()
  labelEn!: string;

  @ApiPropertyOptional({ nullable: true })
  labelVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiProperty()
  value!: string;

  @ApiProperty({ enum: SiteSettingValueType })
  valueType!: SiteSettingValueType;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  isEditable!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}

export class PublicSiteSettingResponseDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  group!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty({ enum: SiteSettingValueType })
  valueType!: SiteSettingValueType;
}
