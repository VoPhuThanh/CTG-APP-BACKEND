import { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-users.interface';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/required-permission.decorators';
import { Request } from 'express';
import { hasPermission } from '../helpers/has-permissions.helper';
const SYSTEM_ADMIN_PERMISSION = 'system:admin';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) throw new ForbiddenException('User is not authenticated');

    const userPermission = new Set(user.permissions ?? []);

    if (userPermission.has(SYSTEM_ADMIN_PERMISSION)) return true;

    const hasAllRequiredPermission = requiredPermissions.every((permission) =>
      hasPermission(userPermission, permission),
    );
    if (!hasAllRequiredPermission)
      throw new ForbiddenException('Insufficient permission');

    return true;
  }
}
