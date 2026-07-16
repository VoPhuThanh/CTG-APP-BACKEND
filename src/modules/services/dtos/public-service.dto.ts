import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationMetaDto } from '@/cores/pagination/pagination-meta.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';

import { ServiceSkillLevel } from '../enums/service.enum';
import { PublicMediaAssetSummaryResponseDto } from '../../media-assets/dtos/media-asset.dto';

export class PublicServiceVariantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  serviceId!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  imageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMax!: number | null;

  @ApiProperty({ enum: ServiceSkillLevel })
  skillLevel!: ServiceSkillLevel;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;
}

export class PublicServiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  imageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [PublicServiceVariantResponseDto] })
  variants!: PublicServiceVariantResponseDto[];
}

export class PublicServiceVariantPaginatedResponseDto extends PaginatedResponseDto<PublicServiceVariantResponseDto> {
  @ApiProperty({ type: [PublicServiceVariantResponseDto] })
  declare data: PublicServiceVariantResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  declare meta: PaginationMetaDto;
}

export class PublicServiceVariantServiceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;
}

export class PublicServiceVariantClubSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicServiceVariantDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  serviceId!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  imageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  bannerImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  bannerImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  modelImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  modelImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMax!: number | null;

  @ApiProperty({ enum: ServiceSkillLevel })
  skillLevel!: ServiceSkillLevel;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: PublicServiceVariantServiceSummaryDto })
  service!: PublicServiceVariantServiceSummaryDto;

  @ApiProperty({ type: [PublicServiceVariantClubSummaryDto] })
  clubs!: PublicServiceVariantClubSummaryDto[];
}
