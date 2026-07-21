import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  mapMediaAssetToPublicSummary,
  mapMediaAssetToSummary,
} from '../media-assets/media-assets.mapper';
import {
  PublicSiteSettingResponseDto,
  SiteSettingResponseDto,
} from './dtos/site-setting.dto';
import { SiteSetting } from './entities/site-setting.entity';

export function mapSiteSettingToResponse(
  setting: SiteSetting,
): SiteSettingResponseDto {
  const dto = new SiteSettingResponseDto();

  dto.id = setting.id;
  dto.key = setting.key;
  dto.group = setting.group;
  dto.labelEn = setting.labelEn;
  dto.labelVi = setting.labelVi ?? null;
  dto.descriptionEn = setting.descriptionEn ?? null;
  dto.descriptionVi = setting.descriptionVi ?? null;
  dto.value = setting.value ?? null;
  dto.valueType = setting.valueType;
  dto.mediaAssetId = setting.mediaAssetId ?? null;
  dto.mediaAsset = mapMediaAssetToSummary(setting.mediaAsset);
  dto.isPublic = setting.isPublic;
  dto.isEditable = setting.isEditable;
  dto.displayOrder = setting.displayOrder;
  dto.metadata = mapMetadataToResponse(setting);

  return dto;
}

export function mapSiteSettingsToResponses(
  settings: SiteSetting[],
): SiteSettingResponseDto[] {
  return settings.map(mapSiteSettingToResponse);
}

export function mapSiteSettingToPublicResponse(
  setting: SiteSetting,
): PublicSiteSettingResponseDto {
  const dto = new PublicSiteSettingResponseDto();

  dto.key = setting.key;
  dto.group = setting.group;
  dto.value = setting.value ?? null;
  dto.valueType = setting.valueType;
  dto.mediaAssetId = setting.mediaAssetId ?? null;
  dto.mediaAsset = mapMediaAssetToPublicSummary(setting.mediaAsset);

  return dto;
}

export function mapSiteSettingsToPublicResponses(
  settings: SiteSetting[],
): PublicSiteSettingResponseDto[] {
  return settings.map(mapSiteSettingToPublicResponse);
}
