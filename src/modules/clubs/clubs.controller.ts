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
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ReorderCollectionDto } from '@/cores/ordering/dtos/reorder-collection.dto';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { ClubsService } from './clubs.service';
import { ClubCreateDto } from './dtos/create-club.dto';
import { ClubUpdateDto } from './dtos/update-club.dto';

@ApiTags('Clubs')
@ApiBearerAuth()
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}
  @ApiOperation({ summary: 'Find public featured clubs' })
  @Get('public/featured')
  findPublicFeaturedClubs() {
    return this.clubsService.findPublicFeaturedClubs();
  }

  @ApiOperation({ summary: 'Find public published clubs' })
  @Get('public')
  findPublicClubs() {
    return this.clubsService.findPublicClubs();
  }

  @ApiOperation({ summary: 'Find public club by slug' })
  @Get('public/:slug')
  findPublicClubBySlug(@Param('slug') slug: string) {
    return this.clubsService.findPublicClubBySlug(slug);
  }

  @ApiOperation({ summary: 'Find all clubs' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by English name, Vietnamese name, slug, address, opening hours, or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: nameEn, nameVi, slug, status, isFeatured, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('clubs:read')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.clubsService.findAll(query);
  }

  @ApiOperation({ summary: 'Find the complete club ordering collection' })
  @Authorized('clubs:read')
  @Get('reorder')
  findReorderList() {
    return this.clubsService.findReorderList();
  }

  @ApiOperation({ summary: 'Replace the complete club order' })
  @Authorized('clubs:update')
  @Patch('reorder')
  reorder(
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.clubsService.reorder(dto.orderedIds, currentUser);
  }

  @ApiOperation({ summary: 'Find club by id' })
  @Authorized('clubs:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create club' })
  @Authorized('clubs:create')
  @Post()
  create(
    @Body() dto: ClubCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.clubsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update club by id' })
  @Authorized('clubs:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: ClubUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.clubsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete club' })
  @Authorized('clubs:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.clubsService.delete(id, currentUser);
  }
}
