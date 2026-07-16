import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../enums/post.enum';
import {
  MediaAssetSummaryResponseDto,
  PublicMediaAssetSummaryResponseDto,
} from '../../media-assets/dtos/media-asset.dto';

export class PostCategorySummaryDto {
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

export class PostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  titleEn!: string;

  @ApiProperty()
  titleVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: PostCategorySummaryDto })
  category!: PostCategorySummaryDto;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentHtmlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentHtmlVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  coverImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  coverImageAssetId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: MediaAssetSummaryResponseDto,
  })
  coverImageAsset!: MediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ enum: PostStatus })
  status!: PostStatus;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}

export class PublicPostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  titleEn!: string;

  @ApiProperty()
  titleVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: PostCategorySummaryDto })
  category!: PostCategorySummaryDto;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentHtmlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentHtmlVi!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  coverImageUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PublicMediaAssetSummaryResponseDto,
  })
  coverImageAsset!: PublicMediaAssetSummaryResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  isFeatured!: boolean;
}
