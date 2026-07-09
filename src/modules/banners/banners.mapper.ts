import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { BannerResponseDto, PublicBannerResponseDto } from './dtos/banner.dto';
import { Banner } from './entities/banner.entity';

export function mapBannerToResponse(banner: Banner): BannerResponseDto {
  const dto = new BannerResponseDto();

  dto.id = banner.id;
  dto.placement = banner.placement;
  dto.titleEn = banner.titleEn ?? null;
  dto.titleVi = banner.titleVi ?? null;
  dto.subtitleEn = banner.subtitleEn ?? null;
  dto.subtitleVi = banner.subtitleVi ?? null;
  dto.imageUrl = banner.imageUrl;
  dto.mobileImageUrl = banner.mobileImageUrl ?? null;
  dto.linkUrlEn = banner.linkUrlEn ?? null;
  dto.linkUrlVi = banner.linkUrlVi ?? null;
  dto.linkTarget = banner.linkTarget;
  dto.status = banner.status;
  dto.displayOrder = banner.displayOrder;
  dto.publishedAt = banner.publishedAt ?? null;
  dto.expiredAt = banner.expiredAt ?? null;
  dto.metadata = mapMetadataToResponse(banner);

  return dto;
}

export function mapBannersToResponses(banners: Banner[]): BannerResponseDto[] {
  return banners.map(mapBannerToResponse);
}

export function mapBannerToPublicResponse(
  banner: Banner,
): PublicBannerResponseDto {
  const dto = new PublicBannerResponseDto();

  dto.id = banner.id;
  dto.placement = banner.placement;
  dto.titleEn = banner.titleEn ?? null;
  dto.titleVi = banner.titleVi ?? null;
  dto.subtitleEn = banner.subtitleEn ?? null;
  dto.subtitleVi = banner.subtitleVi ?? null;
  dto.imageUrl = banner.imageUrl;
  dto.mobileImageUrl = banner.mobileImageUrl ?? null;
  dto.linkUrlEn = banner.linkUrlEn ?? null;
  dto.linkUrlVi = banner.linkUrlVi ?? null;
  dto.linkTarget = banner.linkTarget;

  return dto;
}

export function mapBannersToPublicResponses(
  banners: Banner[],
): PublicBannerResponseDto[] {
  return banners.map(mapBannerToPublicResponse);
}
