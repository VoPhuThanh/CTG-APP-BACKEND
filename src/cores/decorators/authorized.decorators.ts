import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequiredPermissions } from './required-permission.decorators';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function Authorized(...permissions: string[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionsGuard),
    RequiredPermissions(...permissions),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  );
}
