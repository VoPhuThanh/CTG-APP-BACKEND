import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { RoleReponseDto } from './dtos/role.dto';
import { Role } from './entities/role.entity';
import { mapPermissionToSummary } from '@/cores/mappers/permission.mapper';

export function mapRoleToResponse(role: Role): RoleReponseDto {
  const dto = new RoleReponseDto();
  dto.id = role.id;
  dto.name = role.name;
  dto.permission = role.permissions.map(mapPermissionToSummary);
  dto.metadata = mapMetadataToResponse(role);

  return dto;
}
export function mapRolesToResponses(roles: Role[]): RoleReponseDto[] {
  return roles.map(mapRoleToResponse);
}
