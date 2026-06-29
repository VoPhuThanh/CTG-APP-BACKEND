import { Role } from '@/modules/roles/entities/role.entity';
import { roleDto } from '../dtos/role.dto';

export function mapRoleToSummary(role: Role): roleDto {
  const dto = new roleDto();

  dto.id = role.id;
  dto.name = role.name;

  return dto;
}
