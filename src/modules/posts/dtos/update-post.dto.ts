import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PostStatus } from '../enums/post.enum';
import { POST_CONTENT_MAX_BYTES } from '../post-content.constants';

export class PostUpdateDto {
  @ApiPropertyOptional({ example: 'How to Start Training Safely' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @ApiPropertyOptional({ example: 'Cách bắt đầu tập luyện an toàn' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleVi?: string;

  @ApiPropertyOptional({ example: 'how-to-start-training-safely' })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionVi?: string;

  @ApiPropertyOptional({
    example: '/posts/en/how-to-start-training-safely.html',
    deprecated: true,
    description:
      'Deprecated legacy import source. New clients must send contentHtmlEn.',
  })
  @IsOptional()
  @IsString()
  /** @deprecated Temporary legacy import input. */
  contentUrlEn?: string;

  @ApiPropertyOptional({
    example: '/posts/vi/cach-bat-dau-tap-luyen-an-toan.html',
    deprecated: true,
    description:
      'Deprecated legacy import source. New clients must send contentHtmlVi.',
  })
  @IsOptional()
  @IsString()
  /** @deprecated Temporary legacy import input. */
  contentUrlVi?: string;

  @ApiPropertyOptional({
    description:
      'Database-stored English post body HTML. Omission preserves, null clears, and strings are sanitized server-side.',
    nullable: true,
    maxLength: POST_CONTENT_MAX_BYTES,
  })
  @IsOptional()
  @IsString()
  contentHtmlEn?: string | null;

  @ApiPropertyOptional({
    description:
      'Database-stored Vietnamese post body HTML. Omission preserves, null clears, and strings are sanitized server-side.',
    nullable: true,
    maxLength: POST_CONTENT_MAX_BYTES,
  })
  @IsOptional()
  @IsString()
  contentHtmlVi?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/post-cover.jpg',
    deprecated: true,
    description:
      'Deprecated cover fallback. New clients should send coverImageAssetId.',
  })
  @IsOptional()
  @IsString()
  /** @deprecated Use coverImageAssetId. */
  coverImageUrl?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Managed media asset for the post cover image. Omission preserves and explicit null clears.',
  })
  @IsOptional()
  @IsUUID()
  coverImageAssetId?: string | null;

  @ApiPropertyOptional({ example: '2026-07-09T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
