import { Permission } from '@/modules/permissions/entities/permission.entity';
import { permissionDto } from '../dtos/permission.dto';

export function mapPermissionToSummary(permission: Permission): permissionDto {
  const dto = new permissionDto();

  dto.id = permission.id;
  dto.name = permission.name;

  return dto;
}
