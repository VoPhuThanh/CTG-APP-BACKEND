import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function Authenticated() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
