import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionCreateDto } from './dtos/create-permission.dto';
import { PermissionUpdateDto } from './dtos/update-permission.dto';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/cores/guards/permissions.guard';
import { Authorized } from '@/cores/decorators/authorized.decorators';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Find all permission' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'admin' })
  @Authorized('permissions:read')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @ApiOperation({ summary: 'Find permission by id' })
  @Authorized('permissions:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new permission' })
  @Authorized('permissions:create')
  @Post()
  create(
    @Body() dto: PermissionCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update permission by id' })
  @Authorized('permissions:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: PermissionUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.update(id, dto, currentUser);
  }
  @ApiOperation({ summary: 'Soft delete permission' })
  @Authorized('permissions:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.permissionsService.delete(id, currentUser);
  }
}
