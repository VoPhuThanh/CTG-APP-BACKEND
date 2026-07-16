import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MediaAssetSummaryResponseDto,
  PublicMediaAssetSummaryResponseDto,
} from '../../media-assets/dtos/media-asset.dto';
import { PostStatus } from '../enums/post.enum';

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

export class PostListItemResponseDto {
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

export class PostResponseDto extends PostListItemResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Canonical CMS authoring HTML. Managed images use data-media-asset-id markers without permanent src URLs.',
  })
  contentHtmlEn!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Canonical CMS authoring HTML. Managed images use data-media-asset-id markers without permanent src URLs.',
  })
  contentHtmlVi!: string | null;

  @ApiProperty({
    type: MediaAssetSummaryResponseDto,
    isArray: true,
    description:
      'Deduplicated render-ready summaries for managed images referenced by either locale.',
  })
  inlineMediaAssets!: MediaAssetSummaryResponseDto[];
}

export class PublicPostListItemResponseDto {
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

export class PublicPostResponseDto extends PublicPostListItemResponseDto {
  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true, deprecated: true })
  contentUrlVi!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    deprecated: true,
    description:
      'Compatibility alias for resolvedContentHtmlEn. Contains resolved public HTML, not canonical authoring HTML.',
  })
  contentHtmlEn!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    deprecated: true,
    description:
      'Compatibility alias for resolvedContentHtmlVi. Contains resolved public HTML, not canonical authoring HTML.',
  })
  contentHtmlVi!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Resolved public HTML with current media URLs, lazy loading, and dimensions.',
  })
  resolvedContentHtmlEn!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Resolved public HTML with current media URLs, lazy loading, and dimensions.',
  })
  resolvedContentHtmlVi!: string | null;
}
