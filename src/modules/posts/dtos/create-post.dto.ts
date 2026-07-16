import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class PostCreateDto {
  @ApiProperty({ example: 'How to Start Training Safely' })
  @IsString()
  @MaxLength(200)
  titleEn!: string;

  @ApiProperty({ example: 'Cách bắt đầu tập luyện an toàn' })
  @IsString()
  @MaxLength(200)
  titleVi!: string;

  @ApiPropertyOptional({
    example: 'how-to-start-training-safely',
    description: 'If omitted, slug is generated from titleEn.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Post category id.',
  })
  @IsUUID()
  categoryId!: string;

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
    description:
      'URL to the premade English HTML file. This is not post body content.',
  })
  @IsOptional()
  @IsString()
  contentUrlEn?: string;

  @ApiPropertyOptional({
    example: '/posts/vi/cach-bat-dau-tap-luyen-an-toan.html',
    description:
      'URL to the premade Vietnamese HTML file. This is not post body content.',
  })
  @IsOptional()
  @IsString()
  contentUrlVi?: string;

  @ApiPropertyOptional({
    description: 'Database-stored English post body HTML.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  contentHtmlEn?: string | null;

  @ApiPropertyOptional({
    description: 'Database-stored Vietnamese post body HTML.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  contentHtmlVi?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/post-cover.jpg' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Managed media asset for the post cover image.',
  })
  @IsOptional()
  @IsUUID()
  coverImageAssetId?: string | null;

  @ApiPropertyOptional({
    example: '2026-07-09T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
