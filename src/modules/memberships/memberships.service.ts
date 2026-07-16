import {
  MEMBERSHIP_BENEFIT_SORT_FIELDS,
  MEMBERSHIP_LEVEL_SORT_FIELDS,
  MEMBERSHIP_PLAN_SORT_FIELDS,
} from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginatedIds,
  getPaginationSkip,
  getPaginationTake,
  orderEntitiesByIds,
} from '@/cores/pagination/pagination-utils';
import { generateSlug } from '@/cores/utils/slug.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';
import type {
  PublicMembershipBenefitResponseDto,
  PublicMembershipLevelResponseDto,
  PublicMembershipPlanResponseDto,
} from './dtos/public-membership.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { MembershipBenefitCreateDto } from './dtos/create-membership-benefit.dto';
import type { MembershipLevelCreateDto } from './dtos/create-membership-level.dto';
import type { MembershipPlanCreateDto } from './dtos/create-membership-plan.dto';
import type { MembershipBenefitResponseDto } from './dtos/membership-benefit.dto';
import type { MembershipLevelResponseDto } from './dtos/membership-level.dto';
import type { MembershipPlanResponseDto } from './dtos/membership-plan.dto';
import type { MembershipBenefitUpdateDto } from './dtos/update-membership-benefit.dto';
import type { MembershipLevelUpdateDto } from './dtos/update-membership-level.dto';
import type { MembershipPlanUpdateDto } from './dtos/update-membership-plan.dto';
import { MembershipBenefit } from './entities/membership-benefit.entity';
import { MembershipLevel } from './entities/membership-level.entity';
import { MembershipPlan } from './entities/membership-plan.entity';
import { MembershipStatus } from './enums/membership.enum';
import {
  mapMembershipBenefitsToPublicResponses,
  mapMembershipBenefitsToResponses,
  mapMembershipBenefitToPublicResponse,
  mapMembershipBenefitToResponse,
  mapMembershipLevelsToPublicResponses,
  mapMembershipLevelsToResponses,
  mapMembershipLevelToPublicResponse,
  mapMembershipLevelToResponse,
  mapMembershipPlansToPublicResponses,
  mapMembershipPlansToResponses,
  mapMembershipPlanToPublicResponse,
  mapMembershipPlanToResponse,
} from './memberships.mapper';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(MembershipLevel)
    private readonly levelRepository: Repository<MembershipLevel>,

    @InjectRepository(MembershipBenefit)
    private readonly benefitRepository: Repository<MembershipBenefit>,

    @InjectRepository(MembershipPlan)
    private readonly planRepository: Repository<MembershipPlan>,
  ) {}

  async findAllLevels(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<MembershipLevelResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.levelRepository.createQueryBuilder('level');

    if (search) {
      queryBuilder.andWhere(
        `(
          level.nameEn ILIKE :search
          OR level.nameVi ILIKE :search
          OR level.slug ILIKE :search
          OR level.shortDescriptionEn ILIKE :search
          OR level.shortDescriptionVi ILIKE :search
          OR level.descriptionEn ILIKE :search
          OR level.descriptionVi ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (sortBy && sortBy in MEMBERSHIP_LEVEL_SORT_FIELDS) {
      queryBuilder.orderBy(
        `level.${
          MEMBERSHIP_LEVEL_SORT_FIELDS[
            sortBy as keyof typeof MEMBERSHIP_LEVEL_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('level.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('level.createdAt', 'DESC')
      .addOrderBy('level.id', 'ASC');

    const { ids: pageIds, totalItems } = await getPaginatedIds(
      queryBuilder,
      'level',
      query,
    );

    const loadedLevels =
      pageIds.length === 0
        ? []
        : await this.levelRepository
            .createQueryBuilder('level')
            .leftJoinAndSelect('level.plans', 'plan')
            .leftJoinAndSelect('level.benefits', 'benefit')
            .leftJoinAndSelect('level.createdBy', 'createdBy')
            .leftJoinAndSelect('level.updatedBy', 'updatedBy')
            .leftJoinAndSelect('plan.createdBy', 'planCreatedBy')
            .leftJoinAndSelect('plan.updatedBy', 'planUpdatedBy')
            .leftJoinAndSelect('benefit.createdBy', 'benefitCreatedBy')
            .leftJoinAndSelect('benefit.updatedBy', 'benefitUpdatedBy')
            .where('level.id IN (:...pageIds)', { pageIds })
            .orderBy('plan.displayOrder', 'ASC')
            .addOrderBy('plan.durationMonths', 'ASC')
            .addOrderBy('benefit.displayOrder', 'ASC')
            .addOrderBy('benefit.nameEn', 'ASC')
            .getMany();

    const levels = orderEntitiesByIds(loadedLevels, pageIds);

    return buildPaginatedResponse(
      mapMembershipLevelsToResponses(levels),
      totalItems,
      query,
    );
  }

  async findLevel(levelId: string): Promise<MembershipLevelResponseDto> {
    const level = await this.findLevelEntityById(levelId);

    return mapMembershipLevelToResponse(level);
  }

  async createLevel(
    dto: MembershipLevelCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipLevelResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureLevelSlugIsAvailable(slug);

    const benefits = await this.findBenefitsByIdsOrThrow(dto.benefitIds ?? []);

    const level = this.levelRepository.create({
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      slug,
      shortDescriptionEn: dto.shortDescriptionEn,
      shortDescriptionVi: dto.shortDescriptionVi,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      imageUrl: dto.imageUrl,
      isFeatured: dto.isFeatured ?? false,
      status: dto.status ?? MembershipStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      benefits,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.levelRepository.save(level);

    return this.findLevel(level.id);
  }

  async updateLevel(
    levelId: string,
    dto: MembershipLevelUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipLevelResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const level = await this.findLevelEntityById(levelId);

    if (dto.slug && dto.slug !== level.slug) {
      await this.ensureLevelSlugIsAvailable(dto.slug);
      level.slug = dto.slug;
    }

    if (dto.nameEn !== undefined) level.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) level.nameVi = dto.nameVi;
    if (dto.shortDescriptionEn !== undefined) {
      level.shortDescriptionEn = dto.shortDescriptionEn;
    }
    if (dto.shortDescriptionVi !== undefined) {
      level.shortDescriptionVi = dto.shortDescriptionVi;
    }
    if (dto.descriptionEn !== undefined)
      level.descriptionEn = dto.descriptionEn;
    if (dto.descriptionVi !== undefined)
      level.descriptionVi = dto.descriptionVi;
    if (dto.imageUrl !== undefined) level.imageUrl = dto.imageUrl;
    if (dto.isFeatured !== undefined) level.isFeatured = dto.isFeatured;
    if (dto.status !== undefined) level.status = dto.status;
    if (dto.displayOrder !== undefined) level.displayOrder = dto.displayOrder;

    if (dto.benefitIds !== undefined) {
      level.benefits = await this.findBenefitsByIdsOrThrow(dto.benefitIds);
    }

    level.updatedBy = updater;

    await this.levelRepository.save(level);

    return this.findLevel(level.id);
  }

  async deleteLevel(
    levelId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const level = await this.findLevelEntityById(levelId);

    await this.levelRepository.manager.transaction(async (manager) => {
      await manager.update(
        MembershipPlan,
        { level: { id: level.id } },
        { deletedBy: deleter },
      );

      await manager.softDelete(MembershipPlan, {
        level: {
          id: level.id,
        },
      });

      await manager.update(MembershipLevel, level.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(MembershipLevel, level.id);
    });
  }

  async findAllBenefits(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<MembershipBenefitResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.benefitRepository
      .createQueryBuilder('benefit')
      .leftJoinAndSelect('benefit.createdBy', 'createdBy')
      .leftJoinAndSelect('benefit.updatedBy', 'updatedBy');

    if (search) {
      queryBuilder.andWhere(
        `(
          benefit.nameEn ILIKE :search
          OR benefit.nameVi ILIKE :search
          OR benefit.descriptionEn ILIKE :search
          OR benefit.descriptionVi ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (sortBy && sortBy in MEMBERSHIP_BENEFIT_SORT_FIELDS) {
      queryBuilder.orderBy(
        `benefit.${
          MEMBERSHIP_BENEFIT_SORT_FIELDS[
            sortBy as keyof typeof MEMBERSHIP_BENEFIT_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('benefit.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('benefit.createdAt', 'DESC')
      .addOrderBy('benefit.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [benefits, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapMembershipBenefitsToResponses(benefits),
      totalItems,
      query,
    );
  }

  async findBenefit(benefitId: string): Promise<MembershipBenefitResponseDto> {
    const benefit = await this.findBenefitEntityById(benefitId);

    return mapMembershipBenefitToResponse(benefit);
  }

  async createBenefit(
    dto: MembershipBenefitCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipBenefitResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const benefit = this.benefitRepository.create({
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.benefitRepository.save(benefit);

    return this.findBenefit(benefit.id);
  }

  async updateBenefit(
    benefitId: string,
    dto: MembershipBenefitUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipBenefitResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const benefit = await this.findBenefitEntityById(benefitId);

    if (dto.nameEn !== undefined) benefit.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) benefit.nameVi = dto.nameVi;
    if (dto.descriptionEn !== undefined) {
      benefit.descriptionEn = dto.descriptionEn;
    }
    if (dto.descriptionVi !== undefined) {
      benefit.descriptionVi = dto.descriptionVi;
    }
    if (dto.isActive !== undefined) benefit.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) benefit.displayOrder = dto.displayOrder;

    benefit.updatedBy = updater;

    await this.benefitRepository.save(benefit);

    return this.findBenefit(benefit.id);
  }

  async deleteBenefit(
    benefitId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const benefit = await this.findBenefitEntityById(benefitId);

    await this.benefitRepository.manager.transaction(async (manager) => {
      await manager.update(MembershipBenefit, benefit.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(MembershipBenefit, benefit.id);
    });
  }

  async findAllPlans(
    levelId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<MembershipPlanResponseDto>> {
    await this.ensureLevelExists(levelId);

    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.level', 'level')
      .leftJoinAndSelect('plan.createdBy', 'createdBy')
      .leftJoinAndSelect('plan.updatedBy', 'updatedBy')
      .where('level.id = :levelId', { levelId });

    if (search) {
      queryBuilder.andWhere(
        `(
          plan.labelEn ILIKE :search
          OR plan.labelVi ILIKE :search
          OR plan.currency ILIKE :search
          OR CAST(plan.status AS TEXT) ILIKE :search
          OR CAST(plan.durationMonths AS TEXT) ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (sortBy && sortBy in MEMBERSHIP_PLAN_SORT_FIELDS) {
      queryBuilder.orderBy(
        `plan.${
          MEMBERSHIP_PLAN_SORT_FIELDS[
            sortBy as keyof typeof MEMBERSHIP_PLAN_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('plan.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('plan.durationMonths', 'ASC')
      .addOrderBy('plan.createdAt', 'DESC')
      .addOrderBy('plan.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [plans, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapMembershipPlansToResponses(plans),
      totalItems,
      query,
    );
  }

  async findPlan(
    levelId: string,
    planId: string,
  ): Promise<MembershipPlanResponseDto> {
    const plan = await this.findPlanEntityById(levelId, planId);

    return mapMembershipPlanToResponse(plan);
  }

  async createPlan(
    levelId: string,
    dto: MembershipPlanCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipPlanResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const level = await this.ensureLevelExists(levelId);

    await this.ensurePlanDurationIsAvailable(levelId, dto.durationMonths);

    const plan = this.planRepository.create({
      level,
      durationMonths: dto.durationMonths,
      totalPrice: dto.totalPrice,
      currency: dto.currency ?? 'VND',
      labelEn: dto.labelEn,
      labelVi: dto.labelVi,
      isFeatured: dto.isFeatured ?? false,
      status: dto.status ?? MembershipStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.planRepository.save(plan);

    return this.findPlan(levelId, plan.id);
  }

  async updatePlan(
    levelId: string,
    planId: string,
    dto: MembershipPlanUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MembershipPlanResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const plan = await this.findPlanEntityById(levelId, planId);

    if (
      dto.durationMonths !== undefined &&
      dto.durationMonths !== plan.durationMonths
    ) {
      await this.ensurePlanDurationIsAvailable(levelId, dto.durationMonths);
      plan.durationMonths = dto.durationMonths;
    }

    if (dto.totalPrice !== undefined) plan.totalPrice = dto.totalPrice;
    if (dto.currency !== undefined) plan.currency = dto.currency;
    if (dto.labelEn !== undefined) plan.labelEn = dto.labelEn;
    if (dto.labelVi !== undefined) plan.labelVi = dto.labelVi;
    if (dto.isFeatured !== undefined) plan.isFeatured = dto.isFeatured;
    if (dto.status !== undefined) plan.status = dto.status;
    if (dto.displayOrder !== undefined) plan.displayOrder = dto.displayOrder;

    plan.updatedBy = updater;

    await this.planRepository.save(plan);

    return this.findPlan(levelId, plan.id);
  }

  async deletePlan(
    levelId: string,
    planId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const plan = await this.findPlanEntityById(levelId, planId);

    await this.planRepository.manager.transaction(async (manager) => {
      await manager.update(MembershipPlan, plan.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(MembershipPlan, plan.id);
    });
  }

  private async findLevelEntityById(levelId: string): Promise<MembershipLevel> {
    const level = await this.levelRepository.findOne({
      where: {
        id: levelId,
      },
      relations: {
        plans: {
          level: true,
          createdBy: true,
          updatedBy: true,
        },
        benefits: {
          createdBy: true,
          updatedBy: true,
        },
        createdBy: true,
        updatedBy: true,
      },
      order: {
        plans: {
          displayOrder: 'ASC',
          durationMonths: 'ASC',
        },
        benefits: {
          displayOrder: 'ASC',
          nameEn: 'ASC',
        },
      },
    });

    if (!level) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND);
    }

    return level;
  }

  private async findBenefitEntityById(
    benefitId: string,
  ): Promise<MembershipBenefit> {
    const benefit = await this.benefitRepository.findOne({
      where: {
        id: benefitId,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!benefit) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_BENEFIT_NOT_FOUND);
    }

    return benefit;
  }

  private async findPlanEntityById(
    levelId: string,
    planId: string,
  ): Promise<MembershipPlan> {
    const plan = await this.planRepository.findOne({
      where: {
        id: planId,
        level: {
          id: levelId,
        },
      },
      relations: {
        level: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!plan) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_PLAN_NOT_FOUND);
    }

    return plan;
  }

  private async ensureLevelExists(levelId: string): Promise<MembershipLevel> {
    const level = await this.levelRepository.findOne({
      where: {
        id: levelId,
      },
    });

    if (!level) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND);
    }

    return level;
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }

  private async ensureLevelSlugIsAvailable(slug: string): Promise<void> {
    const existingLevel = await this.levelRepository.findOne({
      where: {
        slug,
      },
    });

    if (existingLevel) {
      throw AppError.conflict(
        AppErrorCode.MEMBERSHIP_LEVEL_SLUG_ALREADY_EXISTS,
      );
    }
  }

  private async ensurePlanDurationIsAvailable(
    levelId: string,
    durationMonths: number,
  ): Promise<void> {
    const existingPlan = await this.planRepository.findOne({
      where: {
        level: {
          id: levelId,
        },
        durationMonths,
      },
    });

    if (existingPlan) {
      throw AppError.conflict(AppErrorCode.MEMBERSHIP_PLAN_ALREADY_EXISTS);
    }
  }

  private async findBenefitsByIdsOrThrow(
    benefitIds: string[],
  ): Promise<MembershipBenefit[]> {
    const uniqueBenefitIds = [...new Set(benefitIds)];

    if (uniqueBenefitIds.length === 0) {
      return [];
    }

    const benefits = await this.benefitRepository.find({
      where: {
        id: In(uniqueBenefitIds),
      },
    });

    if (benefits.length !== uniqueBenefitIds.length) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_BENEFIT_NOT_FOUND);
    }

    return benefits;
  }
  async findPublicLevels(): Promise<PublicMembershipLevelResponseDto[]> {
    const levels = await this.levelRepository
      .createQueryBuilder('level')
      .leftJoinAndSelect('level.plans', 'plan', 'plan.status = :planStatus', {
        planStatus: MembershipStatus.PUBLISHED,
      })
      .leftJoinAndSelect(
        'level.benefits',
        'benefit',
        'benefit.isActive = :benefitActive',
        {
          benefitActive: true,
        },
      )
      .where('level.status = :levelStatus', {
        levelStatus: MembershipStatus.PUBLISHED,
      })
      .orderBy('level.displayOrder', 'ASC')
      .addOrderBy('level.id', 'ASC')
      .addOrderBy('plan.displayOrder', 'ASC')
      .addOrderBy('plan.durationMonths', 'ASC')
      .addOrderBy('plan.id', 'ASC')
      .addOrderBy('benefit.displayOrder', 'ASC')
      .addOrderBy('benefit.nameEn', 'ASC')
      .addOrderBy('benefit.id', 'ASC')
      .getMany();
    return mapMembershipLevelsToPublicResponses(levels);
  }
  async findPublicFeaturedLevels(): Promise<
    PublicMembershipLevelResponseDto[]
  > {
    const levels = await this.levelRepository.find({
      where: {
        status: MembershipStatus.PUBLISHED,
        isFeatured: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
      take: 3,
    });

    return mapMembershipLevelsToPublicResponses(levels);
  }
  async findPublicLevelBySlug(
    slug: string,
  ): Promise<PublicMembershipLevelResponseDto> {
    const level = await this.levelRepository
      .createQueryBuilder('level')
      .leftJoinAndSelect('level.plans', 'plan', 'plan.status = :planStatus', {
        planStatus: MembershipStatus.PUBLISHED,
      })
      .leftJoinAndSelect(
        'level.benefits',
        'benefit',
        'benefit.isActive = :benefitIsActive',
        {
          benefitIsActive: true,
        },
      )
      .where('level.slug = :slug', { slug })
      .andWhere('level.status = :levelStatus', {
        levelStatus: MembershipStatus.PUBLISHED,
      })
      .orderBy('plan.displayOrder', 'ASC')
      .addOrderBy('plan.durationMonths', 'ASC')
      .addOrderBy('plan.id', 'ASC')
      .addOrderBy('benefit.displayOrder', 'ASC')
      .addOrderBy('benefit.nameEn', 'ASC')
      .getOne();

    if (!level) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND);
    }

    return mapMembershipLevelToPublicResponse(level);
  }
  async findPublicBenefits(): Promise<PublicMembershipBenefitResponseDto[]> {
    const benefits = await this.benefitRepository.find({
      where: {
        isActive: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
    });

    return mapMembershipBenefitsToPublicResponses(benefits);
  }

  async findPublicBenefit(
    benefitId: string,
  ): Promise<PublicMembershipBenefitResponseDto> {
    const benefit = await this.benefitRepository.findOne({
      where: {
        id: benefitId,
        isActive: true,
      },
    });

    if (!benefit) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_BENEFIT_NOT_FOUND);
    }

    return mapMembershipBenefitToPublicResponse(benefit);
  }
  async findPublicPlansByLevelId(
    levelId: string,
  ): Promise<PublicMembershipPlanResponseDto[]> {
    const level = await this.levelRepository.findOne({
      where: {
        id: levelId,
        status: MembershipStatus.PUBLISHED,
      },
    });

    if (!level) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND);
    }

    const plans = await this.planRepository.find({
      where: {
        level: {
          id: levelId,
        },
        status: MembershipStatus.PUBLISHED,
      },
      relations: {
        level: true,
      },
      order: {
        displayOrder: 'ASC',
        durationMonths: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
    });

    return mapMembershipPlansToPublicResponses(plans);
  }
  async findPublicPlan(
    levelId: string,
    planId: string,
  ): Promise<PublicMembershipPlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: {
        id: planId,
        status: MembershipStatus.PUBLISHED,
        level: {
          id: levelId,
          status: MembershipStatus.PUBLISHED,
        },
      },
      relations: {
        level: true,
      },
    });

    if (!plan) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_PLAN_NOT_FOUND);
    }

    return mapMembershipPlanToPublicResponse(plan);
  }
}
