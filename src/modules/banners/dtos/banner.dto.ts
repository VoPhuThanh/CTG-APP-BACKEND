import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BannerLinkTarget,
  BannerPlacement,
  BannerStatus,
} from '../enums/banner.enum';

export class BannerResponseDto {
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

  @ApiProperty()
  imageUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  mobileImageUrl!: string | null;

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

  @ApiProperty()
  imageUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  mobileImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkUrlVi!: string | null;

  @ApiProperty({ enum: BannerLinkTarget })
  linkTarget!: BannerLinkTarget;
}
