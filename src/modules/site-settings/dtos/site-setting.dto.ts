import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import {
  MediaAssetSummaryResponseDto,
  PublicMediaAssetSummaryResponseDto,
} from '@/modules/media-assets/dtos/media-asset.dto';
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

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Scalar value or legacy URL fallback for a managed media setting.',
  })
  labelVi!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Scalar value or legacy URL fallback for a managed media setting.',
  })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  value!: string | null;

  @ApiProperty({ enum: SiteSettingValueType })
  valueType!: SiteSettingValueType;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  mediaAssetId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: MediaAssetSummaryResponseDto })
  mediaAsset!: MediaAssetSummaryResponseDto | null;

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

  @ApiPropertyOptional({ nullable: true })
  value!: string | null;

  @ApiProperty({ enum: SiteSettingValueType })
  valueType!: SiteSettingValueType;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  mediaAssetId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  mediaAsset!: PublicMediaAssetSummaryResponseDto | null;
}
