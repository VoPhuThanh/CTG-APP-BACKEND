import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCreateDto } from './dtos/create-role.dto';
import { RoleUpdateDto } from './dtos/update-role.dto';
import { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/cores/guards/permissions.guard';
import { Authorized } from '@/cores/decorators/authorized.decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Find all roles' })
  @Authorized('roles:read')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Find roles by id' })
  @Authorized('roles:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create roles' })
  @Authorized('roles:create')
  @Post()
  create(
    @Body() dto: RoleCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update roles' })
  @Authorized('roles:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: RoleUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.update(id, dto, currentUser);
  }
  @ApiOperation({ summary: 'Soft delete roles' })
  @Authorized('roles:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.delete(id, currentUser);
  }

  @ApiOperation({ summary: 'Update permission list inside role' })
  @Authorized('roles:update')
  @Put(':id/permissions')
  permissionAssign(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.permissionAssign(id, dto, currentUser);
  }
}
