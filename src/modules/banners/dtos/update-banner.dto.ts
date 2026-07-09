import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class BannerUpdateDto {
  @ApiPropertyOptional({ enum: BannerPlacement })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleVi?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner-desktop.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

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

  @ApiPropertyOptional({ enum: BannerLinkTarget })
  @IsOptional()
  @IsEnum(BannerLinkTarget)
  linkTarget?: BannerLinkTarget;

  @ApiPropertyOptional({ enum: BannerStatus })
  @IsOptional()
  @IsEnum(BannerStatus)
  status?: BannerStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: '2026-07-08T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-08T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
