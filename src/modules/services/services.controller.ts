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

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { ServiceVariantCreateDto } from './dtos/create-service-variant.dto';
import { ServiceCreateDto } from './dtos/create-service.dto';
import { ServiceVariantUpdateDto } from './dtos/update-service-variant.dto';
import { ServiceUpdateDto } from './dtos/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: 'Find all services' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by English name, Vietnamese name, slug, or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: nameEn, nameVi, slug, status, isFeatured, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('services:read')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.servicesService.findAll(query);
  }

  @ApiOperation({ summary: 'Find service by id' })
  @Authorized('services:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create service' })
  @Authorized('services:create')
  @Post()
  create(
    @Body() dto: ServiceCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update service by id' })
  @Authorized('services:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: ServiceUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete service' })
  @Authorized('services:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.delete(id, currentUser);
  }
  @ApiOperation({ summary: 'Find all service variants by service id' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by English name, Vietnamese name, slug, description, or skill level',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: nameEn, nameVi, slug, status, skillLevel, durationMinutes, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('services:read')
  @Get(':serviceId/variants')
  findAllVariants(
    @Param('serviceId') serviceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.servicesService.findAllVariants(serviceId, query);
  }

  @ApiOperation({ summary: 'Create service variant' })
  @Authorized('services:create')
  @Post(':serviceId/variants')
  createVariant(
    @Param('serviceId') serviceId: string,
    @Body() dto: ServiceVariantCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.createVariant(serviceId, dto, currentUser);
  }

  @ApiOperation({ summary: 'Find service variant by id' })
  @Authorized('services:read')
  @Get(':serviceId/variants/:variantId')
  findVariant(
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.servicesService.findVariant(serviceId, variantId);
  }

  @ApiOperation({ summary: 'Update service variant by id' })
  @Authorized('services:update')
  @Patch(':serviceId/variants/:variantId')
  updateVariant(
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
    @Body() dto: ServiceVariantUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.updateVariant(
      serviceId,
      variantId,
      dto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Soft delete service variant' })
  @Authorized('services:delete')
  @Delete(':serviceId/variants/:variantId')
  deleteVariant(
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.servicesService.deleteVariant(
      serviceId,
      variantId,
      currentUser,
    );
  }
}
