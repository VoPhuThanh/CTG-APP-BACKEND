import { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-users.interface';
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '@/modules/auth/interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return request.user;
  },
);
