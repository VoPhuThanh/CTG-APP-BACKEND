import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceSkillLevel, ServiceStatus } from '../enums/service.enum';
import { ClubStatus } from '../../clubs/enums/club.enum';
import { MediaAssetSummaryResponseDto } from '../../media-assets/dtos/media-asset.dto';

export class ServiceVariantClubSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ClubStatus })
  status!: ClubStatus;
}

export class ServiceVariantResponseDto {
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

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  imageAssetId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: MediaAssetSummaryResponseDto,
  })
  imageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  bannerImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  bannerImageAssetId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: MediaAssetSummaryResponseDto,
  })
  bannerImageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  modelImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  modelImageAssetId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: MediaAssetSummaryResponseDto,
  })
  modelImageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMax!: number | null;

  @ApiProperty({ enum: ServiceSkillLevel })
  skillLevel!: ServiceSkillLevel;

  @ApiProperty({ enum: ServiceStatus })
  status!: ServiceStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [ServiceVariantClubSummaryDto] })
  clubs!: ServiceVariantClubSummaryDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
