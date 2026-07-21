import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicMediaAssetSummaryResponseDto } from '@/modules/media-assets/dtos/media-asset.dto';

export class PublicMembershipBenefitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicMembershipPlanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  levelId!: string;

  @ApiProperty()
  durationMonths!: number;

  @ApiProperty()
  totalPrice!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  labelEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  labelVi!: string | null;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicMembershipLevelResponseDto {
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
  isFeatured!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: [PublicMembershipPlanResponseDto] })
  plans!: PublicMembershipPlanResponseDto[];

  @ApiProperty({ type: [PublicMembershipBenefitResponseDto] })
  benefits!: PublicMembershipBenefitResponseDto[];
}
