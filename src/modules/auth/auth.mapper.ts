import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { AuthenticatedUser } from './interfaces/authenticated-users.interface';

export function mapToAuthenticatedUser(user: User): AuthenticatedUser {
  if (!user.role) {
    throw new UnauthorizedException('User role is missing');
  }

  return {
    id: user.id,
    username: user.username,
    role: {
      id: user.role.id,
      name: user.role.name,
    },
    permissions:
      user.role.permissions?.map((permission) => permission.name) ?? [],
  };
}
