import { mapUserToReponses } from '@/modules/users/users.mapper';
import { metadataResponseDto } from '../dtos/metadata.dto';
import { BaseEntityCore } from '../entities/core-entity';

export function mapMetadataToResponse(
  metadata: BaseEntityCore,
): metadataResponseDto {
  const dto = new metadataResponseDto();
  dto.createdAt = metadata.createdAt;
  dto.createdBy = metadata.createdBy
    ? mapUserToReponses(metadata.createdBy)
    : null;
  dto.updatedAt = metadata.updatedAt;
  dto.updatedBy = metadata.updatedBy
    ? mapUserToReponses(metadata.updatedBy)
    : null;
  dto.deletedAt = metadata.deletedAt;
  dto.deletedBy = metadata.deletedBy
    ? mapUserToReponses(metadata.deletedBy)
    : null;
  return dto;
}
