import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicMediaAssetSummaryResponseDto } from '@/modules/media-assets/dtos/media-asset.dto';
import { PublicClubGalleryMediaResponseDto } from './club-gallery-media.dto';

export class PublicClubFacilitySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  coverImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  coverImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicClubServiceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  imageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicClubListResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  addressEn!: string;

  @ApiProperty()
  addressVi!: string;

  @ApiPropertyOptional({ nullable: true })
  openingHoursTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  openingHoursTextVi!: string | null;

  @ApiProperty({ type: [String] })
  phoneNumbers!: string[];

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  coverImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  coverImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiProperty({ type: [String], deprecated: true })
  galleryImageUrls!: string[];

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [PublicClubFacilitySummaryDto] })
  facilities!: PublicClubFacilitySummaryDto[];

  @ApiProperty({ type: [PublicClubServiceSummaryDto] })
  services!: PublicClubServiceSummaryDto[];
}

export class PublicClubResponseDto extends PublicClubListResponseDto {
  @ApiProperty({ type: [PublicClubGalleryMediaResponseDto] })
  galleryMedia!: PublicClubGalleryMediaResponseDto[];
}
