import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { MediaAssetSummaryResponseDto } from '@/modules/media-assets/dtos/media-asset.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacilityResponseDto {
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

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  coverImageAssetId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: MediaAssetSummaryResponseDto })
  coverImageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
