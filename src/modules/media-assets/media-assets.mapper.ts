import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  MediaAssetSummaryResponseDto,
  MediaAssetResponseDto,
  PublicMediaAssetSummaryResponseDto,
  PublicMediaAssetResponseDto,
} from './dtos/media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';
import { resolveMediaAssetPublicUrl } from './media-asset-url.resolver';

export function mapMediaAssetToResponse(
  asset: MediaAsset,
): MediaAssetResponseDto {
  const dto = new MediaAssetResponseDto();

  dto.id = asset.id;
  dto.name = asset.name;
  dto.altTextEn = asset.altTextEn ?? null;
  dto.altTextVi = asset.altTextVi ?? null;
  dto.descriptionEn = asset.descriptionEn ?? null;
  dto.descriptionVi = asset.descriptionVi ?? null;
  dto.url = resolveMediaAssetPublicUrl(asset);
  dto.storageProvider = asset.storageProvider ?? null;
  dto.bucket = asset.bucket ?? null;
  dto.storageKey = asset.storageKey ?? null;
  dto.originalFilename = asset.originalFilename ?? null;
  dto.checksum = asset.checksum ?? null;
  dto.hasOriginal = Boolean(asset.originalStorageKey);
  dto.originalMimeType = asset.originalMimeType ?? null;
  dto.originalWidth = asset.originalWidth ?? null;
  dto.originalHeight = asset.originalHeight ?? null;
  dto.originalFileSizeBytes = asset.originalFileSizeBytes ?? null;
  dto.cropMetadata = asset.cropMetadata ?? null;
  dto.type = asset.type;
  dto.usage = asset.usage;
  dto.mimeType = asset.mimeType ?? null;
  dto.width = asset.width ?? null;
  dto.height = asset.height ?? null;
  dto.fileSizeBytes = asset.fileSizeBytes ?? null;
  dto.isActive = asset.isActive;
  dto.displayOrder = asset.displayOrder;
  dto.metadata = mapMetadataToResponse(asset);

  return dto;
}

export function mapMediaAssetsToResponses(
  assets: MediaAsset[],
): MediaAssetResponseDto[] {
  return assets.map(mapMediaAssetToResponse);
}

export function mapMediaAssetToPublicResponse(
  asset: MediaAsset,
): PublicMediaAssetResponseDto {
  const dto = new PublicMediaAssetResponseDto();

  dto.id = asset.id;
  dto.name = asset.name;
  dto.altTextEn = asset.altTextEn ?? null;
  dto.altTextVi = asset.altTextVi ?? null;
  dto.url = resolveMediaAssetPublicUrl(asset);
  dto.type = asset.type;
  dto.usage = asset.usage;
  dto.mimeType = asset.mimeType ?? null;
  dto.width = asset.width ?? null;
  dto.height = asset.height ?? null;

  return dto;
}

export function mapMediaAssetsToPublicResponses(
  assets: MediaAsset[],
): PublicMediaAssetResponseDto[] {
  return assets.map(mapMediaAssetToPublicResponse);
}

export function mapMediaAssetToSummary(
  asset?: MediaAsset | null,
): MediaAssetSummaryResponseDto | null {
  if (!asset) return null;

  const dto = new MediaAssetSummaryResponseDto();

  dto.id = asset.id;
  dto.name = asset.name;
  dto.url = resolveMediaAssetPublicUrl(asset);
  dto.altTextEn = asset.altTextEn ?? null;
  dto.altTextVi = asset.altTextVi ?? null;
  dto.width = asset.width ?? null;
  dto.height = asset.height ?? null;
  dto.mimeType = asset.mimeType ?? null;
  dto.isActive = asset.isActive;

  return dto;
}

export function mapMediaAssetToPublicSummary(
  asset?: MediaAsset | null,
): PublicMediaAssetSummaryResponseDto | null {
  if (!asset) return null;

  const dto = new PublicMediaAssetSummaryResponseDto();

  dto.id = asset.id;
  dto.url = resolveMediaAssetPublicUrl(asset);
  dto.altTextEn = asset.altTextEn ?? null;
  dto.altTextVi = asset.altTextVi ?? null;
  dto.width = asset.width ?? null;
  dto.height = asset.height ?? null;
  dto.mimeType = asset.mimeType ?? null;

  return dto;
}
