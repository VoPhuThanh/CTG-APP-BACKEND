import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Authorized } from '@/cores/decorators/authorized.decorators';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import { ReorderCollectionDto } from '@/cores/ordering/dtos/reorder-collection.dto';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { MediaAssetCreateDto } from './dtos/create-media-asset.dto';
import { MediaAssetQueryDto } from './dtos/media-asset-query.dto';
import {
  MediaAssetInUseErrorResponseDto,
  MediaAssetUsageReportResponseDto,
} from './dtos/media-asset-usage.dto';
import { MediaAssetUpdateDto } from './dtos/update-media-asset.dto';
import { MediaAssetUploadDto } from './dtos/upload-media-asset.dto';
import { CropMediaAssetDto } from './dtos/crop-media-asset.dto';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import { MediaImageUploadInterceptor } from './interceptors/media-image-upload.interceptor';
import type { UploadedImageFile } from './interfaces/uploaded-image-file.interface';
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
    description:
      'Search by name, alt text, description, URL, storage provider, storage key, original filename, checksum, or MIME type',
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
      'Allowed values: name, storageProvider, storageKey, originalFilename, checksum, type, usage, mimeType, width, height, fileSizeBytes, isActive, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('media-assets:read')
  @Get()
  findAll(@Query() query: MediaAssetQueryDto) {
    return this.mediaAssetsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Find the complete media-asset ordering collection',
  })
  @Authorized('media-assets:read')
  @Get('reorder')
  findReorderList() {
    return this.mediaAssetsService.findReorderList();
  }

  @ApiOperation({ summary: 'Replace the complete media-asset order' })
  @Authorized('media-assets:update')
  @Patch('reorder')
  reorder(
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.reorder(dto.orderedIds, currentUser);
  }

  @ApiOperation({ summary: 'Report relational usage for a media asset' })
  @ApiOkResponse({ type: MediaAssetUsageReportResponseDto })
  @Authorized('media-assets:read')
  @Get(':id/usage')
  getUsage(@Param('id') id: string) {
    return this.mediaAssetsService.getUsage(id);
  }

  @ApiOperation({ summary: 'Find media asset by id' })
  @Authorized('media-assets:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaAssetsService.findOne(id);
  }

  @ApiOperation({ summary: 'Stream the preserved original image' })
  @ApiProduces('image/jpeg', 'image/png', 'image/gif', 'image/webp')
  @Authorized('media-assets:read')
  @Header('Cache-Control', 'private, no-store')
  @Get(':id/original')
  async getOriginal(@Param('id') id: string): Promise<StreamableFile> {
    const original = await this.mediaAssetsService.getOriginal(id);
    const encodedFilename = encodeURIComponent(original.filename);

    return new StreamableFile(original.buffer, {
      type: original.mimeType,
      disposition: `inline; filename*=UTF-8''${encodedFilename}`,
      length: original.buffer.length,
    });
  }

  @ApiOperation({ summary: 'Upload a managed raster image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'name'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, GIF, or WebP image.',
        },
        name: { type: 'string', maxLength: 150 },
        altTextEn: { type: 'string', maxLength: 255 },
        altTextVi: { type: 'string', maxLength: 255 },
        descriptionEn: { type: 'string' },
        descriptionVi: { type: 'string' },
        usage: { type: 'string', enum: Object.values(MediaAssetUsage) },
        isActive: { type: 'boolean', default: true },
        crop: {
          type: 'string',
          description:
            'Optional JSON crop instructions with x, y, width, height, rotation, aspectRatio, outputFormat, and quality.',
        },
      },
    },
  })
  @Authorized('media-assets:create')
  @UseInterceptors(MediaImageUploadInterceptor)
  @Post('upload')
  uploadImage(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body() dto: MediaAssetUploadDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.uploadImage(file, dto, currentUser);
  }

  @ApiOperation({
    summary: 'Generate a new crop from the preserved original image',
  })
  @Authorized('media-assets:update')
  @Post(':id/crop')
  crop(
    @Param('id') id: string,
    @Body() dto: CropMediaAssetDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.crop(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Create transitional external media asset' })
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
  @ApiConflictResponse({
    description: 'The media asset is still referenced.',
    type: MediaAssetInUseErrorResponseDto,
  })
  @Authorized('media-assets:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.delete(id, currentUser);
  }
}
