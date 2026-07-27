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
import { CustomerLeadsService } from './customer-leads.service';
import { CustomerLeadQueryDto } from './dtos/customer-lead-query.dto';
import { CustomerLeadCreateDto } from './dtos/create-customer-lead.dto';
import { CustomerLeadUpdateDto } from './dtos/update-customer-lead.dto';
import {
  CustomerLeadSource,
  CustomerLeadStatus,
} from './enums/customer-lead.enum';

@ApiTags('Customer Leads')
@ApiBearerAuth()
@Controller('customer-leads')
export class CustomerLeadsController {
  constructor(private readonly customerLeadsService: CustomerLeadsService) {}

  @ApiOperation({ summary: 'Public form submission for customer lead' })
  @Post('public')
  createPublic(@Body() dto: CustomerLeadCreateDto) {
    return this.customerLeadsService.createPublic(dto);
  }

  @ApiOperation({ summary: 'Find all customer leads' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by full name, phone number, email, preferred call time, internal note, club, service, or membership level',
  })
  @ApiQuery({ name: 'source', required: false, enum: CustomerLeadSource })
  @ApiQuery({ name: 'status', required: false, enum: CustomerLeadStatus })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: fullName, phoneNumber, source, status, age, gender, bmiValue, bmiCategory, consentAcceptedAt, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('customer-leads:read')
  @Get()
  findAll(@Query() query: CustomerLeadQueryDto) {
    return this.customerLeadsService.findAll(query);
  }

  @ApiOperation({ summary: 'Find customer lead by id' })
  @Authorized('customer-leads:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerLeadsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create customer lead from CMS' })
  @Authorized('customer-leads:create')
  @Post()
  create(
    @Body() dto: CustomerLeadCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.customerLeadsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update customer lead by id' })
  @Authorized('customer-leads:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CustomerLeadUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.customerLeadsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete customer lead' })
  @Authorized('customer-leads:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.customerLeadsService.delete(id, currentUser);
  }
}
