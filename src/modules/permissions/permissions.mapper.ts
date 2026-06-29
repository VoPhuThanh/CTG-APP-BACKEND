import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { permissionResponseDto } from './dtos/permission.dto';
import { Permission } from './entities/permission.entity';

export function mapPermissionToReponse(
  permission: Permission,
): permissionResponseDto {
  const dto = new permissionResponseDto();
  dto.id = permission.id;
  dto.name = permission.name;
  dto.metadata = mapMetadataToResponse(permission);

  return dto;
}
