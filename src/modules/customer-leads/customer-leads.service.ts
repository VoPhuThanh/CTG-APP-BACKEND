import { CUSTOMER_LEAD_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Club } from '../clubs/entities/club.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import {
  mapCustomerLeadToPublicResponse,
  mapCustomerLeadToResponse,
  mapCustomerLeadsToResponses,
} from './customer-leads.mapper';
import type { CustomerLeadQueryDto } from './dtos/customer-lead-query.dto';
import type {
  CustomerLeadResponseDto,
  PublicCustomerLeadResponseDto,
} from './dtos/customer-lead.dto';
import type { CustomerLeadCreateDto } from './dtos/create-customer-lead.dto';
import type { CustomerLeadUpdateDto } from './dtos/update-customer-lead.dto';
import { CustomerLead } from './entities/customer-lead.entity';
import { BmiCategory, CustomerLeadStatus } from './enums/customer-lead.enum';

@Injectable()
export class CustomerLeadsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(CustomerLead)
    private readonly customerLeadRepository: Repository<CustomerLead>,

    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(MembershipLevel)
    private readonly membershipLevelRepository: Repository<MembershipLevel>,
  ) {}

  async createPublic(
    dto: CustomerLeadCreateDto,
  ): Promise<PublicCustomerLeadResponseDto> {
    const lead = await this.createLeadEntity(dto);

    return mapCustomerLeadToPublicResponse(lead);
  }

  async create(
    dto: CustomerLeadCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<CustomerLeadResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const lead = await this.createLeadEntity(dto, updater);

    return this.findOne(lead.id);
  }

  async findAll(
    query: CustomerLeadQueryDto,
  ): Promise<PaginatedResponseDto<CustomerLeadResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'DESC';
    const search = query.search?.trim();

    const queryBuilder = this.customerLeadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.preferredClub', 'preferredClub')
      .leftJoinAndSelect('lead.interestedService', 'interestedService')
      .leftJoinAndSelect(
        'lead.interestedMembershipLevel',
        'interestedMembershipLevel',
      )
      .leftJoinAndSelect('lead.updatedBy', 'updatedBy');

    if (query.source) {
      queryBuilder.andWhere('lead.source = :source', {
        source: query.source,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('lead.status = :status', {
        status: query.status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          lead.fullName ILIKE :search
          OR lead.phoneNumber ILIKE :search
          OR lead.preferredCallTime ILIKE :search
          OR lead.internalNote ILIKE :search
          OR preferredClub.nameEn ILIKE :search
          OR preferredClub.nameVi ILIKE :search
          OR interestedService.nameEn ILIKE :search
          OR interestedService.nameVi ILIKE :search
          OR interestedMembershipLevel.nameEn ILIKE :search
          OR interestedMembershipLevel.nameVi ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in CUSTOMER_LEAD_SORT_FIELDS) {
      queryBuilder.orderBy(
        `lead.${
          CUSTOMER_LEAD_SORT_FIELDS[
            sortBy as keyof typeof CUSTOMER_LEAD_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('lead.createdAt', 'DESC');
    }

    queryBuilder
      .addOrderBy('lead.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [leads, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapCustomerLeadsToResponses(leads),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<CustomerLeadResponseDto> {
    const lead = await this.findEntityById(id);

    return mapCustomerLeadToResponse(lead);
  }

  async update(
    id: string,
    dto: CustomerLeadUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<CustomerLeadResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const lead = await this.findEntityById(id);

    if (dto.fullName !== undefined) lead.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) lead.phoneNumber = dto.phoneNumber;
    if (dto.source !== undefined) lead.source = dto.source;
    if (dto.preferredCallTime !== undefined) {
      lead.preferredCallTime = dto.preferredCallTime;
    }
    if (dto.age !== undefined) lead.age = dto.age;
    if (dto.gender !== undefined) lead.gender = dto.gender;

    if (dto.heightCm !== undefined) lead.heightCm = dto.heightCm;
    if (dto.weightKg !== undefined) lead.weightKg = dto.weightKg;

    if (dto.interestedServiceId !== undefined) {
      lead.interestedService = dto.interestedServiceId
        ? await this.findServiceByIdOrThrow(dto.interestedServiceId)
        : undefined;
    }

    if (dto.preferredClubId !== undefined) {
      lead.preferredClub = dto.preferredClubId
        ? await this.findClubByIdOrThrow(dto.preferredClubId)
        : undefined;
    }

    if (dto.interestedMembershipLevelId !== undefined) {
      lead.interestedMembershipLevel = dto.interestedMembershipLevelId
        ? await this.findMembershipLevelByIdOrThrow(
            dto.interestedMembershipLevelId,
          )
        : undefined;
    }
    if (dto.status !== undefined) lead.status = dto.status;
    if (dto.internalNote !== undefined) lead.internalNote = dto.internalNote;

    if (dto.consentAccepted !== undefined) {
      lead.consentAccepted = dto.consentAccepted;
      lead.consentAcceptedAt = dto.consentAccepted ? new Date() : undefined;
    }
    if (dto.promotionConsentAccepted !== undefined) {
      lead.promotionConsentAccepted = dto.promotionConsentAccepted;
    }

    const bmiResult = this.calculateBmi(lead.heightCm, lead.weightKg);
    lead.bmiValue = bmiResult.bmiValue;
    lead.bmiCategory = bmiResult.bmiCategory;

    lead.updatedBy = updater;

    await this.customerLeadRepository.save(lead);

    return this.findOne(lead.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const lead = await this.findEntityById(id);

    await this.customerLeadRepository.manager.transaction(async (manager) => {
      await manager.update(CustomerLead, lead.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(CustomerLead, lead.id);
    });
  }

  private async createLeadEntity(
    dto: CustomerLeadCreateDto,
    updater?: User,
  ): Promise<CustomerLead> {
    if (!dto.consentAccepted) {
      throw AppError.badRequest(AppErrorCode.CUSTOMER_LEAD_CONSENT_REQUIRED);
    }

    const preferredClub = dto.preferredClubId
      ? await this.findClubByIdOrThrow(dto.preferredClubId)
      : undefined;

    const interestedService = dto.interestedServiceId
      ? await this.findServiceByIdOrThrow(dto.interestedServiceId)
      : undefined;

    const interestedMembershipLevel = dto.interestedMembershipLevelId
      ? await this.findMembershipLevelByIdOrThrow(
          dto.interestedMembershipLevelId,
        )
      : undefined;

    const bmiResult = this.calculateBmi(dto.heightCm, dto.weightKg);

    const lead = this.customerLeadRepository.create({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      source: dto.source,
      preferredClub,
      preferredCallTime: dto.preferredCallTime,
      age: dto.age,
      gender: dto.gender,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      bmiValue: bmiResult.bmiValue,
      bmiCategory: bmiResult.bmiCategory,
      interestedService,
      interestedMembershipLevel,
      status: CustomerLeadStatus.NEW,
      consentAccepted: dto.consentAccepted,
      consentAcceptedAt: new Date(),
      promotionConsentAccepted: dto.promotionConsentAccepted ?? false,
      updatedBy: updater,
    });

    await this.customerLeadRepository.save(lead);

    return lead;
  }

  private async findEntityById(id: string): Promise<CustomerLead> {
    const lead = await this.customerLeadRepository.findOne({
      where: {
        id,
      },
      relations: {
        preferredClub: true,
        interestedService: true,
        interestedMembershipLevel: true,
        updatedBy: true,
      },
    });

    if (!lead) {
      throw AppError.notFound(AppErrorCode.CUSTOMER_LEAD_NOT_FOUND);
    }

    return lead;
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

  private async findClubByIdOrThrow(clubId: string): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: {
        id: clubId,
      },
    });

    if (!club) {
      throw AppError.notFound(AppErrorCode.CLUB_NOT_FOUND);
    }

    return club;
  }

  private async findServiceByIdOrThrow(serviceId: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return service;
  }

  private async findMembershipLevelByIdOrThrow(
    membershipLevelId: string,
  ): Promise<MembershipLevel> {
    const membershipLevel = await this.membershipLevelRepository.findOne({
      where: {
        id: membershipLevelId,
      },
    });

    if (!membershipLevel) {
      throw AppError.notFound(AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND);
    }

    return membershipLevel;
  }

  private calculateBmi(
    heightCm?: number,
    weightKg?: string,
  ): {
    bmiValue?: string;
    bmiCategory?: BmiCategory;
  } {
    if (!heightCm || !weightKg) {
      return {
        bmiValue: undefined,
        bmiCategory: undefined,
      };
    }

    const weight = Number(weightKg);

    if (!Number.isFinite(weight) || weight <= 0 || heightCm <= 0) {
      return {
        bmiValue: undefined,
        bmiCategory: undefined,
      };
    }

    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const bmiValue = bmi.toFixed(2);

    return {
      bmiValue,
      bmiCategory: this.getBmiCategory(bmi),
    };
  }

  private getBmiCategory(bmi: number): BmiCategory {
    if (bmi < 18.5) {
      return BmiCategory.UNDERWEIGHT;
    }

    if (bmi < 25) {
      return BmiCategory.NORMAL;
    }

    if (bmi < 30) {
      return BmiCategory.OVERWEIGHT;
    }

    return BmiCategory.OBESE;
  }
}
