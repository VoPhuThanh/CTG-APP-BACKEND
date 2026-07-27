import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicMediaAssetSummaryResponseDto } from '@/modules/media-assets/dtos/media-asset.dto';

export class PublicFacilityResponseDto {
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
