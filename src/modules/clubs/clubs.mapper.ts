import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  mapMediaAssetToPublicSummary,
  mapMediaAssetToSummary,
} from '../media-assets/media-assets.mapper';
import { Facility } from '../facilities/entities/facility.entity';
import { Service } from '../services/entities/service.entity';
import {
  ClubFacilitySummaryDto,
  ClubResponseDto,
  ClubServiceSummaryDto,
} from './dtos/club.dto';
import { Club } from './entities/club.entity';
import {
  PublicClubFacilitySummaryDto,
  PublicClubListResponseDto,
  PublicClubResponseDto,
  PublicClubServiceSummaryDto,
} from './dtos/public-club.dto';

function mapClubFacilityToSummary(facility: Facility): ClubFacilitySummaryDto {
  const dto = new ClubFacilitySummaryDto();

  dto.id = facility.id;
  dto.nameEn = facility.nameEn;
  dto.nameVi = facility.nameVi;
  dto.slug = facility.slug;
  dto.isActive = facility.isActive;

  return dto;
}

function mapClubServiceToSummary(service: Service): ClubServiceSummaryDto {
  const dto = new ClubServiceSummaryDto();

  dto.id = service.id;
  dto.nameEn = service.nameEn;
  dto.nameVi = service.nameVi;
  dto.slug = service.slug;
  dto.status = service.status;

  return dto;
}

function sortByDisplayOrderThenName<
  T extends { displayOrder?: number; nameEn: string },
>(left: T, right: T): number {
  return (
    (left.displayOrder ?? 0) - (right.displayOrder ?? 0) ||
    left.nameEn.localeCompare(right.nameEn)
  );
}

export function mapClubToResponse(club: Club): ClubResponseDto {
  const dto = new ClubResponseDto();

  dto.id = club.id;
  dto.nameEn = club.nameEn;
  dto.nameVi = club.nameVi;
  dto.slug = club.slug;
  dto.addressEn = club.addressEn;
  dto.addressVi = club.addressVi;
  dto.openingHoursTextEn = club.openingHoursTextEn ?? null;
  dto.openingHoursTextVi = club.openingHoursTextVi ?? null;
  dto.phoneNumbers = club.phoneNumbers ?? [];
  dto.shortDescriptionEn = club.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = club.shortDescriptionVi ?? null;
  dto.descriptionEn = club.descriptionEn ?? null;
  dto.descriptionVi = club.descriptionVi ?? null;
  dto.coverImageUrl = club.coverImageUrl ?? null;
  dto.coverImageAssetId = club.coverImageAssetId ?? null;
  dto.coverImageAsset = mapMediaAssetToSummary(club.coverImageAsset);
  dto.galleryImageUrls = club.galleryImageUrls ?? [];
  dto.galleryMedia = [...(club.galleryMedia ?? [])]
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.id.localeCompare(right.id),
    )
    .map((galleryItem) => ({
      id: galleryItem.id,
      mediaAssetId: galleryItem.mediaAssetId,
      displayOrder: galleryItem.displayOrder,
      mediaAsset: mapMediaAssetToSummary(galleryItem.mediaAsset)!,
    }));
  dto.status = club.status;
  dto.displayOrder = club.displayOrder;
  dto.isFeatured = club.isFeatured;

  dto.facilities = [...(club.facilities ?? [])]
    .sort(sortByDisplayOrderThenName)
    .map(mapClubFacilityToSummary);

  dto.services = [...(club.services ?? [])]
    .sort(sortByDisplayOrderThenName)
    .map(mapClubServiceToSummary);

  dto.metadata = mapMetadataToResponse(club);

  return dto;
}

export function mapClubsToResponses(clubs: Club[]): ClubResponseDto[] {
  return clubs.map(mapClubToResponse);
}

function mapClubFacilityToPublicSummary(
  facility: Facility,
): PublicClubFacilitySummaryDto {
  const dto = new PublicClubFacilitySummaryDto();

  dto.id = facility.id;
  dto.nameEn = facility.nameEn;
  dto.nameVi = facility.nameVi;
  dto.slug = facility.slug;
  dto.descriptionEn = facility.descriptionEn ?? null;
  dto.descriptionVi = facility.descriptionVi ?? null;
  dto.coverImageUrl = facility.coverImageUrl ?? null;
  dto.coverImageAsset = mapMediaAssetToPublicSummary(facility.coverImageAsset);
  dto.displayOrder = facility.displayOrder;

  return dto;
}

function mapClubServiceToPublicSummary(
  service: Service,
): PublicClubServiceSummaryDto {
  const dto = new PublicClubServiceSummaryDto();

  dto.id = service.id;
  dto.nameEn = service.nameEn;
  dto.nameVi = service.nameVi;
  dto.slug = service.slug;
  dto.imageUrl = service.imageUrl ?? null;
  dto.imageAsset = mapMediaAssetToPublicSummary(service.imageAsset);
  dto.displayOrder = service.displayOrder;

  return dto;
}
export function mapClubToPublicListResponse(
  club: Club,
): PublicClubListResponseDto {
  const dto = new PublicClubListResponseDto();

  dto.id = club.id;
  dto.nameEn = club.nameEn;
  dto.nameVi = club.nameVi;
  dto.slug = club.slug;
  dto.addressEn = club.addressEn;
  dto.addressVi = club.addressVi;
  dto.openingHoursTextEn = club.openingHoursTextEn ?? null;
  dto.openingHoursTextVi = club.openingHoursTextVi ?? null;
  dto.phoneNumbers = club.phoneNumbers ?? [];
  dto.shortDescriptionEn = club.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = club.shortDescriptionVi ?? null;
  dto.descriptionEn = club.descriptionEn ?? null;
  dto.descriptionVi = club.descriptionVi ?? null;
  dto.coverImageUrl = club.coverImageUrl ?? null;
  dto.coverImageAsset = mapMediaAssetToPublicSummary(club.coverImageAsset);
  dto.galleryImageUrls = club.galleryImageUrls ?? [];
  dto.displayOrder = club.displayOrder;
  dto.isFeatured = club.isFeatured;

  dto.facilities = [...(club.facilities ?? [])]
    .sort(sortByDisplayOrderThenName)
    .map(mapClubFacilityToPublicSummary);

  dto.services = [...(club.services ?? [])]
    .sort(sortByDisplayOrderThenName)
    .map(mapClubServiceToPublicSummary);

  return dto;
}

export function mapClubToPublicResponse(club: Club): PublicClubResponseDto {
  const dto = Object.assign(
    new PublicClubResponseDto(),
    mapClubToPublicListResponse(club),
  );

  dto.galleryMedia = [...(club.galleryMedia ?? [])]
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.id.localeCompare(right.id),
    )
    .map((galleryItem) => ({
      id: galleryItem.id,
      displayOrder: galleryItem.displayOrder,
      mediaAsset: mapMediaAssetToPublicSummary(galleryItem.mediaAsset)!,
    }));

  return dto;
}

export function mapClubsToPublicListResponses(
  clubs: Club[],
): PublicClubListResponseDto[] {
  return clubs.map(mapClubToPublicListResponse);
}
