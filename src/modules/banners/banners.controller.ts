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
import { BannersService } from './banners.service';
import {
  BannerQueryDto,
  PublicBannerPlacementQueryDto,
} from './dtos/banner-query.dto';
import { BannerCreateDto } from './dtos/create-banner.dto';
import { BannerUpdateDto } from './dtos/update-banner.dto';
import {
  BannerReorderDto,
  BannerReorderQueryDto,
} from './dtos/reorder-banners.dto';
import { BannerPlacement, BannerStatus } from './enums/banner.enum';

@ApiTags('Banners')
@ApiBearerAuth()
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @ApiOperation({ summary: 'Find public homepage hero carousel banners' })
  @Get('public/hero-carousel')
  findPublicHeroCarousel() {
    return this.bannersService.findPublicHeroCarousel();
  }

  @ApiOperation({
    summary: 'Find active public banners for a canonical placement',
  })
  @Get('public')
  findPublicByPlacement(@Query() query: PublicBannerPlacementQueryDto) {
    return this.bannersService.findPublicByPlacement(query.placement);
  }

  @ApiOperation({ summary: 'Find all banners' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title, subtitle, image URL, or link URL',
  })
  @ApiQuery({ name: 'placement', required: false, enum: BannerPlacement })
  @ApiQuery({ name: 'status', required: false, enum: BannerStatus })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: placement, titleEn, titleVi, status, displayOrder, publishedAt, expiredAt, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('banners:read')
  @Get()
  findAll(@Query() query: BannerQueryDto) {
    return this.bannersService.findAll(query);
  }

  @ApiOperation({
    summary: 'Find the complete banner ordering collection for a placement',
  })
  @Authorized('banners:read')
  @Get('reorder')
  findReorderList(@Query() query: BannerReorderQueryDto) {
    return this.bannersService.findReorderList(query.placement);
  }

  @ApiOperation({
    summary: 'Replace the complete banner order for a placement',
  })
  @Authorized('banners:update')
  @Patch('reorder')
  reorder(
    @Body() dto: BannerReorderDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.bannersService.reorder(
      dto.placement,
      dto.orderedIds,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Find banner by id' })
  @Authorized('banners:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @ApiOperation({ summary: 'Create banner' })
  @Authorized('banners:create')
  @Post()
  create(
    @Body() dto: BannerCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.bannersService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update banner by id' })
  @Authorized('banners:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: BannerUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.bannersService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete banner' })
  @Authorized('banners:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.bannersService.delete(id, currentUser);
  }
}
