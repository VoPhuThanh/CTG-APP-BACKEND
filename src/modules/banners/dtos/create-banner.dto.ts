import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BannerLinkTarget,
  BannerPlacement,
  BannerStatus,
} from '../enums/banner.enum';

export class BannerCreateDto {
  @ApiPropertyOptional({
    enum: BannerPlacement,
    default: BannerPlacement.HOMEPAGE_CAROUSEL,
  })
  @IsOptional()
  @IsEnum(BannerPlacement)
  placement?: BannerPlacement;

  @ApiPropertyOptional({ example: 'Train stronger today' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titleEn?: string;

  @ApiPropertyOptional({ example: 'Tập luyện mạnh mẽ hơn hôm nay' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titleVi?: string;

  @ApiPropertyOptional({ example: 'Join CTG Fitness and start your journey.' })
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional({
    example: 'Tham gia CTG Fitness và bắt đầu hành trình của bạn.',
  })
  @IsOptional()
  @IsString()
  subtitleVi?: string;

  @ApiProperty({ example: 'https://example.com/banner-desktop.jpg' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner-mobile.jpg' })
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @ApiPropertyOptional({ example: '/en/memberships' })
  @IsOptional()
  @IsString()
  linkUrlEn?: string;

  @ApiPropertyOptional({ example: '/vi/goi-hoi-vien' })
  @IsOptional()
  @IsString()
  linkUrlVi?: string;

  @ApiPropertyOptional({
    enum: BannerLinkTarget,
    default: BannerLinkTarget.SELF,
  })
  @IsOptional()
  @IsEnum(BannerLinkTarget)
  linkTarget?: BannerLinkTarget;

  @ApiPropertyOptional({
    enum: BannerStatus,
    default: BannerStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(BannerStatus)
  status?: BannerStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    example: '2026-07-08T00:00:00.000Z',
    description: 'If null or omitted, banner can be published immediately.',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({
    example: '2026-08-08T00:00:00.000Z',
    description: 'If null or omitted, banner does not expire automatically.',
  })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
