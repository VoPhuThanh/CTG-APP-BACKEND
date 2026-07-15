import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { MembershipBenefitResponseDto } from './dtos/membership-benefit.dto';
import { MembershipLevelResponseDto } from './dtos/membership-level.dto';
import { MembershipPlanResponseDto } from './dtos/membership-plan.dto';
import { MembershipBenefit } from './entities/membership-benefit.entity';
import { MembershipLevel } from './entities/membership-level.entity';
import { MembershipPlan } from './entities/membership-plan.entity';
import {
  PublicMembershipBenefitResponseDto,
  PublicMembershipPlanResponseDto,
  PublicMembershipLevelResponseDto,
} from './dtos/public-membership.dto';

export function mapMembershipBenefitToResponse(
  benefit: MembershipBenefit,
): MembershipBenefitResponseDto {
  const dto = new MembershipBenefitResponseDto();

  dto.id = benefit.id;
  dto.nameEn = benefit.nameEn;
  dto.nameVi = benefit.nameVi;
  dto.descriptionEn = benefit.descriptionEn ?? null;
  dto.descriptionVi = benefit.descriptionVi ?? null;
  dto.isActive = benefit.isActive;
  dto.displayOrder = benefit.displayOrder;
  dto.metadata = mapMetadataToResponse(benefit);

  return dto;
}

export function mapMembershipBenefitsToResponses(
  benefits: MembershipBenefit[],
): MembershipBenefitResponseDto[] {
  return benefits.map(mapMembershipBenefitToResponse);
}

export function mapMembershipPlanToResponse(
  plan: MembershipPlan,
  fallbackLevelId?: string,
): MembershipPlanResponseDto {
  const dto = new MembershipPlanResponseDto();

  dto.id = plan.id;
  dto.levelId = plan.level?.id ?? fallbackLevelId ?? '';
  dto.durationMonths = plan.durationMonths;
  dto.totalPrice = plan.totalPrice;
  dto.currency = plan.currency;
  dto.labelEn = plan.labelEn ?? null;
  dto.labelVi = plan.labelVi ?? null;
  dto.isFeatured = plan.isFeatured;
  dto.status = plan.status;
  dto.displayOrder = plan.displayOrder;
  dto.metadata = mapMetadataToResponse(plan);

  return dto;
}

export function mapMembershipPlansToResponses(
  plans: MembershipPlan[],
  fallbackLevelId?: string,
): MembershipPlanResponseDto[] {
  return plans.map((plan) =>
    mapMembershipPlanToResponse(plan, fallbackLevelId),
  );
}

export function mapMembershipLevelToResponse(
  level: MembershipLevel,
): MembershipLevelResponseDto {
  const dto = new MembershipLevelResponseDto();

  dto.id = level.id;
  dto.nameEn = level.nameEn;
  dto.nameVi = level.nameVi;
  dto.slug = level.slug;
  dto.shortDescriptionEn = level.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = level.shortDescriptionVi ?? null;
  dto.descriptionEn = level.descriptionEn ?? null;
  dto.descriptionVi = level.descriptionVi ?? null;
  dto.imageUrl = level.imageUrl ?? null;
  dto.isFeatured = level.isFeatured;
  dto.status = level.status;
  dto.displayOrder = level.displayOrder;
  dto.plans = mapMembershipPlansToResponses(level.plans ?? [], level.id);
  dto.benefits = mapMembershipBenefitsToResponses(level.benefits ?? []);
  dto.metadata = mapMetadataToResponse(level);

  return dto;
}

export function mapMembershipLevelsToResponses(
  levels: MembershipLevel[],
): MembershipLevelResponseDto[] {
  return levels.map(mapMembershipLevelToResponse);
}
export function mapMembershipBenefitToPublicResponse(
  benefit: MembershipBenefit,
): PublicMembershipBenefitResponseDto {
  const dto = new PublicMembershipBenefitResponseDto();

  dto.id = benefit.id;
  dto.nameEn = benefit.nameEn;
  dto.nameVi = benefit.nameVi;
  dto.descriptionEn = benefit.descriptionEn ?? null;
  dto.descriptionVi = benefit.descriptionVi ?? null;
  dto.displayOrder = benefit.displayOrder;

  return dto;
}

export function mapMembershipBenefitsToPublicResponses(
  benefits: MembershipBenefit[],
): PublicMembershipBenefitResponseDto[] {
  return benefits.map(mapMembershipBenefitToPublicResponse);
}

export function mapMembershipPlanToPublicResponse(
  plan: MembershipPlan,
  fallbackLevelId?: string,
): PublicMembershipPlanResponseDto {
  const dto = new PublicMembershipPlanResponseDto();

  dto.id = plan.id;
  dto.levelId = plan.level?.id ?? fallbackLevelId ?? '';
  dto.durationMonths = plan.durationMonths;
  dto.totalPrice = plan.totalPrice;
  dto.currency = plan.currency;
  dto.labelEn = plan.labelEn ?? null;
  dto.labelVi = plan.labelVi ?? null;
  dto.isFeatured = plan.isFeatured;
  dto.displayOrder = plan.displayOrder;

  return dto;
}

export function mapMembershipPlansToPublicResponses(
  plans: MembershipPlan[],
  fallbackLevelId?: string,
): PublicMembershipPlanResponseDto[] {
  return plans.map((plan) =>
    mapMembershipPlanToPublicResponse(plan, fallbackLevelId),
  );
}

export function mapMembershipLevelToPublicResponse(
  level: MembershipLevel,
): PublicMembershipLevelResponseDto {
  const dto = new PublicMembershipLevelResponseDto();

  dto.id = level.id;
  dto.nameEn = level.nameEn;
  dto.nameVi = level.nameVi;
  dto.slug = level.slug;
  dto.shortDescriptionEn = level.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = level.shortDescriptionVi ?? null;
  dto.descriptionEn = level.descriptionEn ?? null;
  dto.descriptionVi = level.descriptionVi ?? null;
  dto.imageUrl = level.imageUrl ?? null;
  dto.isFeatured = level.isFeatured;
  dto.displayOrder = level.displayOrder;

  dto.plans = mapMembershipPlansToPublicResponses(level.plans ?? [], level.id);
  dto.benefits = mapMembershipBenefitsToPublicResponses(level.benefits ?? []);

  return dto;
}

export function mapMembershipLevelsToPublicResponses(
  levels: MembershipLevel[],
): PublicMembershipLevelResponseDto[] {
  return levels.map(mapMembershipLevelToPublicResponse);
}
