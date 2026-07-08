import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubStatus } from '../enums/club.enum';

export class ClubFacilitySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class ClubServiceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  status!: string;
}

export class ClubResponseDto {
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

  @ApiProperty({ enum: ClubStatus })
  status!: ClubStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [ClubFacilitySummaryDto] })
  facilities!: ClubFacilitySummaryDto[];

  @ApiProperty({ type: [ClubServiceSummaryDto] })
  services!: ClubServiceSummaryDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
