import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import {
  MediaAssetSummaryResponseDto,
  PublicMediaAssetSummaryResponseDto,
} from '@/modules/media-assets/dtos/media-asset.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BannerLinkTarget,
  LegacyBannerPlacement,
  BannerPlacement,
  BannerStatus,
} from '../enums/banner.enum';

export class BannerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ enum: BannerPlacement, nullable: true })
  placement!: BannerPlacement | null;

  @ApiPropertyOptional({
    enum: LegacyBannerPlacement,
    nullable: true,
    readOnly: true,
    description: 'Original placement retained for archived legacy records.',
  })
  legacyPlacement!: LegacyBannerPlacement | null;

  @ApiPropertyOptional({ nullable: true })
  titleEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  titleVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subtitleEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subtitleVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  imageAssetId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: MediaAssetSummaryResponseDto })
  imageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  mobileImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  mobileImageAssetId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: MediaAssetSummaryResponseDto })
  mobileImageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlVi!: string | null;

  @ApiProperty({ enum: BannerLinkTarget })
  linkTarget!: BannerLinkTarget;

  @ApiProperty({ enum: BannerStatus })
  status!: BannerStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  expiredAt!: Date | null;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}

export class PublicBannerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: BannerPlacement })
  placement!: BannerPlacement;

  @ApiPropertyOptional({ nullable: true })
  titleEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  titleVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subtitleEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subtitleVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  imageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  mobileImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  mobileImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlVi!: string | null;

  @ApiProperty({ enum: BannerLinkTarget })
  linkTarget!: BannerLinkTarget;
}
