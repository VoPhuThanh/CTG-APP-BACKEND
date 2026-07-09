import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  MediaAssetResponseDto,
  PublicMediaAssetResponseDto,
} from './dtos/media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';

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
  dto.url = asset.url;
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
  dto.url = asset.url;
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
