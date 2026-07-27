import { Permissions } from '@/modules/permissions/entities/permission.entity';
import { PermissionDto } from '../dtos/permission.dto';

export function mapPermissionToSummary(permission: Permissions): PermissionDto {
  const dto = new PermissionDto();

  dto.id = permission.id;
  dto.name = permission.name;
  dto.module = permission.module;
  dto.action = permission.action;

  return dto;
}
