import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { ServiceVariantResponseDto } from './dtos/service-variant.dto';
import { ServiceResponseDto } from './dtos/service.dto';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';

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
  dto.durationMinutes = variant.durationMinutes ?? null;
  dto.caloriesBurnedMin = variant.caloriesBurnedMin ?? null;
  dto.caloriesBurnedMax = variant.caloriesBurnedMax ?? null;
  dto.skillLevel = variant.skillLevel;
  dto.status = variant.status;
  dto.displayOrder = variant.displayOrder;
  dto.isFeatured = variant.isFeatured;
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
  dto.metadata = mapMetadataToResponse(service);

  return dto;
}

export function mapServicesToResponses(
  services: Service[],
): ServiceResponseDto[] {
  return services.map(mapServiceToResponse);
}
