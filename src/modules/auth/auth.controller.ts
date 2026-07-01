import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginReponseDto } from './dtos/login-response.dto';
import { LoginDto } from './dtos/login.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-users.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from '@/cores/guards/permissions.guard';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: LoginReponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid username or password' })
  login(@Body() dto: LoginDto): Promise<LoginReponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  getMe(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user;
  }
}
