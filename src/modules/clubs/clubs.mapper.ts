import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
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
  dto.galleryImageUrls = club.galleryImageUrls ?? [];
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
  dto.displayOrder = service.displayOrder;

  return dto;
}
export function mapClubToPublicResponse(club: Club): PublicClubResponseDto {
  const dto = new PublicClubResponseDto();

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

export function mapClubsToPublicResponses(
  clubs: Club[],
): PublicClubResponseDto[] {
  return clubs.map(mapClubToPublicResponse);
}
