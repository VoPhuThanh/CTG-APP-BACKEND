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
import { MediaAssetCreateDto } from './dtos/create-media-asset.dto';
import { MediaAssetQueryDto } from './dtos/media-asset-query.dto';
import { MediaAssetUpdateDto } from './dtos/update-media-asset.dto';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import { MediaAssetsService } from './media-assets.service';

@ApiTags('Media Assets')
@ApiBearerAuth()
@Controller('media-assets')
export class MediaAssetsController {
  constructor(private readonly mediaAssetsService: MediaAssetsService) {}

  @ApiOperation({ summary: 'Find public active media assets' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: MediaAssetType })
  @ApiQuery({ name: 'usage', required: false, enum: MediaAssetUsage })
  @Get('public')
  findPublic(@Query() query: MediaAssetQueryDto) {
    return this.mediaAssetsService.findPublic(query);
  }

  @ApiOperation({ summary: 'Find all media assets' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, alt text, description, URL, or MIME type',
  })
  @ApiQuery({ name: 'type', required: false, enum: MediaAssetType })
  @ApiQuery({ name: 'usage', required: false, enum: MediaAssetUsage })
  @ApiQuery({
    name: 'isActive',
    required: false,
    enum: ['true', 'false'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: name, type, usage, mimeType, width, height, fileSizeBytes, isActive, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('media-assets:read')
  @Get()
  findAll(@Query() query: MediaAssetQueryDto) {
    return this.mediaAssetsService.findAll(query);
  }

  @ApiOperation({ summary: 'Find media asset by id' })
  @Authorized('media-assets:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaAssetsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create media asset' })
  @Authorized('media-assets:create')
  @Post()
  create(
    @Body() dto: MediaAssetCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update media asset by id' })
  @Authorized('media-assets:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: MediaAssetUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete media asset' })
  @Authorized('media-assets:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.delete(id, currentUser);
  }
}
