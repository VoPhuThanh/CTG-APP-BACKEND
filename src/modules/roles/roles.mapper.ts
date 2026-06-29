import { RoleReponseDto } from './dtos/role.dto';
import { Role } from './entities/role.entity';

export function mapRoleToResponse(role: Role): RoleReponseDto {
  const dto = new RoleReponseDto();
  dto.id = role.id;
  dto.roleName = role.roleName;

  return dto;
}
