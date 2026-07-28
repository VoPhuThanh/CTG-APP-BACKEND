import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Authorized } from '@/cores/decorators/authorized.decorators';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { SiteSettingCreateDto } from './dtos/create-site-setting.dto';
import { SiteSettingQueryDto } from './dtos/site-setting-query.dto';
import { SiteSettingUpdateDto } from './dtos/update-site-setting.dto';
import {
  SiteSettingReorderDto,
  SiteSettingReorderQueryDto,
} from './dtos/reorder-site-settings.dto';
import { SiteSettingValueType } from './enums/site-setting.enum';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings')
@ApiBearerAuth()
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @ApiOperation({ summary: 'Find public site settings' })
  @ApiQuery({
    name: 'group',
    required: false,
    type: String,
    example: 'general',
  })
  @Get('public')
  findPublic(@Query() query: SiteSettingQueryDto) {
    return this.siteSettingsService.findPublic(query);
  }

  @ApiOperation({ summary: 'Find all site settings' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by key, group, label, description, or value',
  })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiQuery({ name: 'valueType', required: false, enum: SiteSettingValueType })
  @ApiQuery({ name: 'isPublic', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'isEditable', required: false, enum: ['true', 'false'] })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: key, group, labelEn, valueType, isPublic, isEditable, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('site-settings:read')
  @Get()
  findAll(@Query() query: SiteSettingQueryDto) {
    return this.siteSettingsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Find the complete site-setting ordering collection for a group',
  })
  @Authorized('site-settings:read')
  @Get('reorder')
  findReorderList(@Query() query: SiteSettingReorderQueryDto) {
    return this.siteSettingsService.findReorderList(query.group);
  }

  @ApiOperation({
    summary: 'Replace the complete site-setting order for a group',
  })
  @Authorized('site-settings:update')
  @Patch('reorder')
  reorder(
    @Body() dto: SiteSettingReorderDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.siteSettingsService.reorder(
      dto.group,
      dto.orderedIds,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Find site setting by id' })
  @Authorized('site-settings:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.siteSettingsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create site setting' })
  @Authorized('site-settings:create')
  @Post()
  create(
    @Body() dto: SiteSettingCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.siteSettingsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update site setting by id' })
  @Authorized('site-settings:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: SiteSettingUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.siteSettingsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete site setting' })
  @Authorized('site-settings:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.siteSettingsService.delete(id, currentUser);
  }
}
