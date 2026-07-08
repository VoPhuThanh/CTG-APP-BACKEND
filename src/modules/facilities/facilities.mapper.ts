import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { FacilityResponseDto } from './dtos/facility.dto';
import { Facility } from './entities/facility.entity';

export function mapFacilityToResponse(facility: Facility): FacilityResponseDto {
  const dto = new FacilityResponseDto();

  dto.id = facility.id;
  dto.nameEn = facility.nameEn;
  dto.nameVi = facility.nameVi;
  dto.slug = facility.slug;
  dto.descriptionEn = facility.descriptionEn ?? null;
  dto.descriptionVi = facility.descriptionVi ?? null;
  dto.coverImageUrl = facility.coverImageUrl ?? null;
  dto.isActive = facility.isActive;
  dto.displayOrder = facility.displayOrder;
  dto.metadata = mapMetadataToResponse(facility);

  return dto;
}

export function mapFacilitiesToResponses(
  facilities: Facility[],
): FacilityResponseDto[] {
  return facilities.map(mapFacilityToResponse);
}
