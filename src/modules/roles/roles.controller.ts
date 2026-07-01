import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCreateDto } from './dtos/create-role.dto';
import { RoleUpdateDto } from './dtos/update-role.dto';
import { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Authenticated } from '@/cores/decorators/authenticated.decorators';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Find all roles' })
  @Authenticated()
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Find roles by id' })
  @Authenticated()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create roles' })
  @Authenticated()
  @Post()
  create(
    @Body() dto: RoleCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update roles' })
  @Authenticated()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: RoleUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.update(id, dto, currentUser);
  }
  @ApiOperation({ summary: 'Soft delete roles' })
  @Authenticated()
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.delete(id, currentUser);
  }

  @ApiOperation({ summary: 'Update permission list inside role' })
  @Authenticated()
  @Put(':id/permissions')
  permissionAssign(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.rolesService.permissionAssign(id, dto, currentUser);
  }
}
