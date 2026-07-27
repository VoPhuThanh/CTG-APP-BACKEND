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
import { MembershipBenefitCreateDto } from './dtos/create-membership-benefit.dto';
import { MembershipLevelCreateDto } from './dtos/create-membership-level.dto';
import { MembershipPlanCreateDto } from './dtos/create-membership-plan.dto';
import { MembershipBenefitUpdateDto } from './dtos/update-membership-benefit.dto';
import { MembershipLevelUpdateDto } from './dtos/update-membership-level.dto';
import { MembershipPlanUpdateDto } from './dtos/update-membership-plan.dto';
import { MembershipsService } from './memberships.service';

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}
  @ApiOperation({ summary: 'Find public featured membership levels' })
  @Get('public/levels/featured')
  findPublicFeaturedLevels() {
    return this.membershipsService.findPublicFeaturedLevels();
  }

  @ApiOperation({ summary: 'Find public membership plan by id' })
  @Get('public/levels/:levelId/plans/:planId')
  findPublicPlan(
    @Param('levelId') levelId: string,
    @Param('planId') planId: string,
  ) {
    return this.membershipsService.findPublicPlan(levelId, planId);
  }

  @ApiOperation({ summary: 'Find public plans under a membership level' })
  @Get('public/levels/:levelId/plans')
  findPublicPlansByLevelId(@Param('levelId') levelId: string) {
    return this.membershipsService.findPublicPlansByLevelId(levelId);
  }

  @ApiOperation({ summary: 'Find public published membership levels' })
  @Get('public/levels')
  findPublicLevels() {
    return this.membershipsService.findPublicLevels();
  }

  @ApiOperation({ summary: 'Find public membership level by slug' })
  @Get('public/levels/:slug')
  findPublicLevelBySlug(@Param('slug') slug: string) {
    return this.membershipsService.findPublicLevelBySlug(slug);
  }

  @ApiOperation({ summary: 'Find public active membership benefits' })
  @Get('public/benefits')
  findPublicBenefits() {
    return this.membershipsService.findPublicBenefits();
  }

  @ApiOperation({ summary: 'Find public membership benefit by id' })
  @Get('public/benefits/:benefitId')
  findPublicBenefit(@Param('benefitId') benefitId: string) {
    return this.membershipsService.findPublicBenefit(benefitId);
  }

  @ApiOperation({ summary: 'Find all membership levels' })
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
  @Authorized('memberships:read')
  @Get('levels')
  findAllLevels(@Query() query: PaginationQueryDto) {
    return this.membershipsService.findAllLevels(query);
  }

  @ApiOperation({
    summary: 'Find the complete membership-level ordering collection',
  })
  @Authorized('memberships:read')
  @Get('levels/reorder')
  findLevelReorderList() {
    return this.membershipsService.findLevelReorderList();
  }

  @ApiOperation({ summary: 'Replace the complete membership-level order' })
  @Authorized('memberships:update')
  @Patch('levels/reorder')
  reorderLevels(
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.reorderLevels(dto.orderedIds, currentUser);
  }

  @ApiOperation({ summary: 'Find membership level by id' })
  @Authorized('memberships:read')
  @Get('levels/:levelId')
  findLevel(@Param('levelId') levelId: string) {
    return this.membershipsService.findLevel(levelId);
  }

  @ApiOperation({ summary: 'Create membership level' })
  @Authorized('memberships:create')
  @Post('levels')
  createLevel(
    @Body() dto: MembershipLevelCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.createLevel(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update membership level by id' })
  @Authorized('memberships:update')
  @Patch('levels/:levelId')
  updateLevel(
    @Param('levelId') levelId: string,
    @Body() dto: MembershipLevelUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.updateLevel(levelId, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete membership level' })
  @Authorized('memberships:delete')
  @Delete('levels/:levelId')
  deleteLevel(
    @Param('levelId') levelId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.deleteLevel(levelId, currentUser);
  }

  @ApiOperation({ summary: 'Find all membership benefits' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by English name, Vietnamese name, or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: nameEn, nameVi, isActive, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('memberships:read')
  @Get('benefits')
  findAllBenefits(@Query() query: PaginationQueryDto) {
    return this.membershipsService.findAllBenefits(query);
  }

  @ApiOperation({
    summary: 'Find the complete membership-benefit ordering collection',
  })
  @Authorized('memberships:read')
  @Get('benefits/reorder')
  findBenefitReorderList() {
    return this.membershipsService.findBenefitReorderList();
  }

  @ApiOperation({ summary: 'Replace the complete membership-benefit order' })
  @Authorized('memberships:update')
  @Patch('benefits/reorder')
  reorderBenefits(
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.reorderBenefits(dto.orderedIds, currentUser);
  }

  @ApiOperation({ summary: 'Find membership benefit by id' })
  @Authorized('memberships:read')
  @Get('benefits/:benefitId')
  findBenefit(@Param('benefitId') benefitId: string) {
    return this.membershipsService.findBenefit(benefitId);
  }

  @ApiOperation({ summary: 'Create membership benefit' })
  @Authorized('memberships:create')
  @Post('benefits')
  createBenefit(
    @Body() dto: MembershipBenefitCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.createBenefit(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update membership benefit by id' })
  @Authorized('memberships:update')
  @Patch('benefits/:benefitId')
  updateBenefit(
    @Param('benefitId') benefitId: string,
    @Body() dto: MembershipBenefitUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.updateBenefit(benefitId, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete membership benefit' })
  @Authorized('memberships:delete')
  @Delete('benefits/:benefitId')
  deleteBenefit(
    @Param('benefitId') benefitId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.deleteBenefit(benefitId, currentUser);
  }

  @ApiOperation({ summary: 'Find all plans under a membership level' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by label, currency, status, or duration',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: durationMonths, totalPrice, currency, status, isFeatured, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('memberships:read')
  @Get('levels/:levelId/plans')
  findAllPlans(
    @Param('levelId') levelId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.membershipsService.findAllPlans(levelId, query);
  }

  @ApiOperation({
    summary:
      'Find the complete membership-plan ordering collection for a level',
  })
  @Authorized('memberships:read')
  @Get('levels/:levelId/plans/reorder')
  findPlanReorderList(@Param('levelId') levelId: string) {
    return this.membershipsService.findPlanReorderList(levelId);
  }

  @ApiOperation({
    summary: 'Replace the complete membership-plan order for a level',
  })
  @Authorized('memberships:update')
  @Patch('levels/:levelId/plans/reorder')
  reorderPlans(
    @Param('levelId') levelId: string,
    @Body() dto: ReorderCollectionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.reorderPlans(
      levelId,
      dto.orderedIds,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Find membership plan by id' })
  @Authorized('memberships:read')
  @Get('levels/:levelId/plans/:planId')
  findPlan(@Param('levelId') levelId: string, @Param('planId') planId: string) {
    return this.membershipsService.findPlan(levelId, planId);
  }

  @ApiOperation({ summary: 'Create membership plan under a level' })
  @Authorized('memberships:create')
  @Post('levels/:levelId/plans')
  createPlan(
    @Param('levelId') levelId: string,
    @Body() dto: MembershipPlanCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.createPlan(levelId, dto, currentUser);
  }

  @ApiOperation({ summary: 'Update membership plan by id' })
  @Authorized('memberships:update')
  @Patch('levels/:levelId/plans/:planId')
  updatePlan(
    @Param('levelId') levelId: string,
    @Param('planId') planId: string,
    @Body() dto: MembershipPlanUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.updatePlan(
      levelId,
      planId,
      dto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Soft delete membership plan' })
  @Authorized('memberships:delete')
  @Delete('levels/:levelId/plans/:planId')
  deletePlan(
    @Param('levelId') levelId: string,
    @Param('planId') planId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.membershipsService.deletePlan(levelId, planId, currentUser);
  }
}
