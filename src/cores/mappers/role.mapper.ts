import { Role } from '@/modules/roles/entities/role.entity';
import { RoleDto } from '../dtos/role.dto';

export function mapRoleToSummary(role: Role): RoleDto {
  const dto = new RoleDto();

  dto.id = role.id;
  dto.name = role.name;

  return dto;
}
