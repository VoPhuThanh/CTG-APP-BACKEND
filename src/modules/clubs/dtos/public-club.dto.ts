import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  coverImageUrl!: string | null;

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

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  displayOrder!: number;
}

export class PublicClubResponseDto {
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

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty({ type: [String] })
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
