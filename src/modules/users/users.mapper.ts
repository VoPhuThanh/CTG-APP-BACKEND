import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dtos/users.reponse.dto';

export function mapUserToReponses(user) {
  return plainToInstance(UserResponseDto, user, {
    excludeExtraneousValues: true,
  });
}
