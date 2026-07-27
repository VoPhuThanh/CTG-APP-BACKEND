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
import { FacilityCreateDto } from './dtos/create-facility.dto';
import { FacilityUpdateDto } from './dtos/update-facility.dto';
import { FacilitiesService } from './facilities.service';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @ApiOperation({ summary: 'Find public active facilities' })
  @Get('public')
  findPublicFacilities() {
    return this.facilitiesService.findPublicFacilities();
  }

  @ApiOperation({ summary: 'Find public facility by slug' })
  @Get('public/:slug')
  findPublicFacilityBySlug(@Param('slug') slug: string) {
    return this.facilitiesService.findPublicFacilityBySlug(slug);
  }

  @ApiOperation({ summary: 'Find all facilities' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'sauna' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'nameEn',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('facilities:read')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.facilitiesService.findAll(query);
  }

  @ApiOperation({ summary: 'Find the complete facility ordering collection' })
  @Authorized('facilities:read')
  @Get('reorder')
  findReorderList() {
    return this.facilitiesService.findReorderList();
  }

  @ApiOperation({ summary: 'Replace the complete facility order' })
  @Authorized('facilities:update')
  @Patch('reorder')
  reorder(
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.facilitiesService.reorder(dto.orderedIds, currentUser);
  }

  @ApiOperation({ summary: 'Find facility by id' })
  @Authorized('facilities:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create facility' })
  @Authorized('facilities:create')
  @Post()
  create(
    @Body() dto: FacilityCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.facilitiesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update facility by id' })
  @Authorized('facilities:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: FacilityUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.facilitiesService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete facility' })
  @Authorized('facilities:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.facilitiesService.delete(id, currentUser);
  }
}
