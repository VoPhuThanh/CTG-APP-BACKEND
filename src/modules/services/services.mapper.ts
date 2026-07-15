import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { ServiceVariantResponseDto } from './dtos/service-variant.dto';
import { ServiceResponseDto } from './dtos/service.dto';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import {
  PublicServiceVariantDetailResponseDto,
  PublicServiceVariantResponseDto,
  PublicServiceResponseDto,
} from './dtos/public-service.dto';

function sortClubs<
  T extends { displayOrder: number; nameEn: string; id: string },
>(left: T, right: T): number {
  return (
    left.displayOrder - right.displayOrder ||
    left.nameEn.localeCompare(right.nameEn) ||
    left.id.localeCompare(right.id)
  );
}

export function mapServiceVariantToResponse(
  variant: ServiceVariant,
  fallbackServiceId?: string,
): ServiceVariantResponseDto {
  const dto = new ServiceVariantResponseDto();

  dto.id = variant.id;
  dto.serviceId = variant.service?.id ?? fallbackServiceId ?? '';
  dto.nameEn = variant.nameEn;
  dto.nameVi = variant.nameVi;
  dto.slug = variant.slug;
  dto.shortDescriptionEn = variant.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = variant.shortDescriptionVi ?? null;
  dto.descriptionEn = variant.descriptionEn ?? null;
  dto.descriptionVi = variant.descriptionVi ?? null;
  dto.imageUrl = variant.imageUrl ?? null;
  dto.bannerImageUrl = variant.bannerImageUrl ?? null;
  dto.modelImageUrl = variant.modelImageUrl ?? null;
  dto.durationMinutes = variant.durationMinutes ?? null;
  dto.caloriesBurnedMin = variant.caloriesBurnedMin ?? null;
  dto.caloriesBurnedMax = variant.caloriesBurnedMax ?? null;
  dto.skillLevel = variant.skillLevel;
  dto.status = variant.status;
  dto.displayOrder = variant.displayOrder;
  dto.isFeatured = variant.isFeatured;
  dto.clubs = [...(variant.clubs ?? [])].sort(sortClubs).map((club) => ({
    id: club.id,
    nameEn: club.nameEn,
    nameVi: club.nameVi,
    slug: club.slug,
    status: club.status,
  }));
  dto.metadata = mapMetadataToResponse(variant);

  return dto;
}

export function mapServiceVariantsToResponses(
  variants: ServiceVariant[],
  fallbackServiceId?: string,
): ServiceVariantResponseDto[] {
  return variants.map((variant) =>
    mapServiceVariantToResponse(variant, fallbackServiceId),
  );
}

export function mapServiceToResponse(service: Service): ServiceResponseDto {
  const dto = new ServiceResponseDto();

  dto.id = service.id;
  dto.nameEn = service.nameEn;
  dto.nameVi = service.nameVi;
  dto.slug = service.slug;
  dto.shortDescriptionEn = service.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = service.shortDescriptionVi ?? null;
  dto.descriptionEn = service.descriptionEn ?? null;
  dto.descriptionVi = service.descriptionVi ?? null;
  dto.imageUrl = service.imageUrl ?? null;
  dto.status = service.status;
  dto.displayOrder = service.displayOrder;
  dto.isFeatured = service.isFeatured;
  dto.variants = mapServiceVariantsToResponses(
    service.variants ?? [],
    service.id,
  );
  dto.clubs = [...(service.clubs ?? [])].sort(sortClubs).map((club) => ({
    id: club.id,
    nameEn: club.nameEn,
    nameVi: club.nameVi,
    slug: club.slug,
    status: club.status,
  }));
  dto.metadata = mapMetadataToResponse(service);

  return dto;
}

export function mapServicesToResponses(
  services: Service[],
): ServiceResponseDto[] {
  return services.map(mapServiceToResponse);
}
export function mapServiceVariantToPublicResponse(
  variant: ServiceVariant,
): PublicServiceVariantResponseDto {
  const dto = new PublicServiceVariantResponseDto();

  dto.id = variant.id;
  dto.serviceId = variant.service.id;
  dto.nameEn = variant.nameEn;
  dto.nameVi = variant.nameVi;
  dto.slug = variant.slug;
  dto.shortDescriptionEn = variant.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = variant.shortDescriptionVi ?? null;
  dto.descriptionEn = variant.descriptionEn ?? null;
  dto.descriptionVi = variant.descriptionVi ?? null;
  dto.imageUrl = variant.imageUrl ?? null;
  dto.durationMinutes = variant.durationMinutes ?? null;
  dto.caloriesBurnedMin = variant.caloriesBurnedMin ?? null;
  dto.caloriesBurnedMax = variant.caloriesBurnedMax ?? null;
  dto.skillLevel = variant.skillLevel;
  dto.displayOrder = variant.displayOrder;
  dto.isFeatured = variant.isFeatured;

  return dto;
}

export function mapServiceVariantsToPublicResponses(
  variants: ServiceVariant[],
): PublicServiceVariantResponseDto[] {
  return variants.map(mapServiceVariantToPublicResponse);
}

export function mapServiceVariantToPublicDetailResponse(
  variant: ServiceVariant,
): PublicServiceVariantDetailResponseDto {
  const dto = new PublicServiceVariantDetailResponseDto();

  dto.id = variant.id;
  dto.serviceId = variant.service.id;
  dto.nameEn = variant.nameEn;
  dto.nameVi = variant.nameVi;
  dto.slug = variant.slug;
  dto.shortDescriptionEn = variant.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = variant.shortDescriptionVi ?? null;
  dto.descriptionEn = variant.descriptionEn ?? null;
  dto.descriptionVi = variant.descriptionVi ?? null;
  dto.imageUrl = variant.imageUrl ?? null;
  dto.bannerImageUrl = variant.bannerImageUrl ?? null;
  dto.modelImageUrl = variant.modelImageUrl ?? null;
  dto.durationMinutes = variant.durationMinutes ?? null;
  dto.caloriesBurnedMin = variant.caloriesBurnedMin ?? null;
  dto.caloriesBurnedMax = variant.caloriesBurnedMax ?? null;
  dto.skillLevel = variant.skillLevel;
  dto.displayOrder = variant.displayOrder;
  dto.isFeatured = variant.isFeatured;
  dto.service = {
    id: variant.service.id,
    nameEn: variant.service.nameEn,
    nameVi: variant.service.nameVi,
    slug: variant.service.slug,
  };
  dto.clubs = [...(variant.clubs ?? [])].sort(sortClubs).map((club) => ({
    id: club.id,
    nameEn: club.nameEn,
    nameVi: club.nameVi,
    slug: club.slug,
    displayOrder: club.displayOrder,
  }));

  return dto;
}

export function mapServiceToPublicResponse(
  service: Service,
): PublicServiceResponseDto {
  const dto = new PublicServiceResponseDto();

  dto.id = service.id;
  dto.nameEn = service.nameEn;
  dto.nameVi = service.nameVi;
  dto.slug = service.slug;
  dto.shortDescriptionEn = service.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = service.shortDescriptionVi ?? null;
  dto.descriptionEn = service.descriptionEn ?? null;
  dto.descriptionVi = service.descriptionVi ?? null;
  dto.imageUrl = service.imageUrl ?? null;
  dto.displayOrder = service.displayOrder;
  dto.isFeatured = service.isFeatured;
  dto.variants = mapServiceVariantsToPublicResponses(service.variants ?? []);

  return dto;
}

export function mapServicesToPublicResponses(
  services: Service[],
): PublicServiceResponseDto[] {
  return services.map(mapServiceToPublicResponse);
}
