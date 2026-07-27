import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  mapMediaAssetToPublicSummary,
  mapMediaAssetToSummary,
} from '../media-assets/media-assets.mapper';
import { BannerResponseDto, PublicBannerResponseDto } from './dtos/banner.dto';
import { Banner } from './entities/banner.entity';
import { BannerPlacement } from './enums/banner.enum';

export function mapBannerToResponse(banner: Banner): BannerResponseDto {
  const dto = new BannerResponseDto();

  dto.id = banner.id;
  dto.placement = banner.placement;
  dto.legacyPlacement =
    banner.legacyPlacement as BannerResponseDto['legacyPlacement'];
  dto.titleEn = banner.titleEn ?? null;
  dto.titleVi = banner.titleVi ?? null;
  dto.subtitleEn = banner.subtitleEn ?? null;
  dto.subtitleVi = banner.subtitleVi ?? null;
  dto.imageUrl = banner.imageUrl ?? null;
  dto.imageAssetId = banner.imageAssetId ?? null;
  dto.imageAsset = mapMediaAssetToSummary(banner.imageAsset);
  dto.mobileImageUrl = banner.mobileImageUrl ?? null;
  dto.mobileImageAssetId = banner.mobileImageAssetId ?? null;
  dto.mobileImageAsset = mapMediaAssetToSummary(banner.mobileImageAsset);
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
  dto.placement = banner.placement as BannerPlacement;
  dto.titleEn = banner.titleEn ?? null;
  dto.titleVi = banner.titleVi ?? null;
  dto.subtitleEn = banner.subtitleEn ?? null;
  dto.subtitleVi = banner.subtitleVi ?? null;
  dto.imageUrl = banner.imageUrl ?? null;
  dto.imageAsset = mapMediaAssetToPublicSummary(banner.imageAsset);
  dto.mobileImageUrl = banner.mobileImageUrl ?? null;
  dto.mobileImageAsset = mapMediaAssetToPublicSummary(banner.mobileImageAsset);
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
