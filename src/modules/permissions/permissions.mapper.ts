import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { PermissionResponseDto } from './dtos/permission.dto';
import { Permissions } from './entities/permission.entity';

export function mapPermissionToReponse(
  permission: Permissions,
): PermissionResponseDto {
  const dto = new PermissionResponseDto();
  dto.id = permission.id;
  dto.name = permission.name;
  dto.description = permission.description;
  dto.action = permission.action;
  dto.module = permission.module;
  dto.metadata = mapMetadataToResponse(permission);

  return dto;
}
export function mapPermissionsToReponses(
  permission: Permissions[],
): PermissionResponseDto[] {
  return permission.map(mapPermissionToReponse);
}
