import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { mapRoleToResponse } from '../roles/roles.mapper';
import { UserResponseDto } from './dtos/users.reponse.dto';
import { User } from './entities/user.entity';

export function mapUserToReponses(user: User): UserResponseDto {
  const dto = new UserResponseDto();
  dto.id = user.id;
  dto.username = user.username;
  dto.role = mapRoleToResponse(user.role);
  dto.metadata = mapMetadataToResponse(user);
  return dto;
}
export function mapUsersToResponses(users: User[]): UserResponseDto[] {
  return users.map(mapUserToReponses);
}
