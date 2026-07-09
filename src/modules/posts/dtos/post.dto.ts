import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({ nullable: true })
  contentUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentUrlVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

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

  @ApiPropertyOptional({ nullable: true })
  contentUrlEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentUrlVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  isFeatured!: boolean;
}
