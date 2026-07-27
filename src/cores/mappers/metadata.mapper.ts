import { User } from '@/modules/users/entities/user.entity';
import { mapUserSummaryToResponse } from './user.mapper';
import { MetadataResponseDto } from '../dtos/metadata.dto';

export function mapMetadataToResponse(entity: {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}): MetadataResponseDto {
  const dto = new MetadataResponseDto();

  dto.createdAt = entity.createdAt;
  dto.updatedAt = entity.updatedAt;
  dto.deletedAt = entity.deletedAt;

  dto.createdBy = entity.createdBy
    ? mapUserSummaryToResponse(entity.createdBy)
    : null;

  dto.updatedBy = entity.updatedBy
    ? mapUserSummaryToResponse(entity.updatedBy)
    : null;

  dto.deletedBy = entity.deletedBy
    ? mapUserSummaryToResponse(entity.deletedBy)
    : null;
  return dto;
}
