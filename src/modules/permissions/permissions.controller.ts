import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionCreateDto } from './dtos/create-permission.dto';
import { PermissionUpdateDto } from './dtos/update-permission.dto';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Authenticated } from '@/cores/decorators/authenticated.decorators';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Find all permission' })
  @Authenticated()
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'Find permission by id' })
  @Authenticated()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new permission' })
  @Authenticated()
  @Post()
  create(
    @Body() dto: PermissionCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update permission by id' })
  @Authenticated()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: PermissionUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.update(id, dto, currentUser);
  }
  @ApiOperation({ summary: 'Soft delete permission' })
  @Authenticated()
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.delete(id, currentUser);
  }
}
