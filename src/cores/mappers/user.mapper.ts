import { User } from '@/modules/users/entities/user.entity';
import { UserDto } from '../dtos/user.dto';

export function mapUserSummaryToResponse(user: User): UserDto {
  const dto = new UserDto();
  dto.id = user.id;
  dto.username = user.username;
  return dto;
}
