import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import { Club } from '../clubs/entities/club.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { Service } from '../services/entities/service.entity';
import {
  CustomerLeadClubSummaryDto,
  CustomerLeadMembershipLevelSummaryDto,
  CustomerLeadResponseDto,
  CustomerLeadServiceSummaryDto,
  PublicCustomerLeadResponseDto,
} from './dtos/customer-lead.dto';
import { CustomerLead } from './entities/customer-lead.entity';

function mapClubToSummary(club: Club): CustomerLeadClubSummaryDto {
  const dto = new CustomerLeadClubSummaryDto();

  dto.id = club.id;
  dto.nameEn = club.nameEn;
  dto.nameVi = club.nameVi;
  dto.slug = club.slug;

  return dto;
}

function mapServiceToSummary(service: Service): CustomerLeadServiceSummaryDto {
  const dto = new CustomerLeadServiceSummaryDto();

  dto.id = service.id;
  dto.nameEn = service.nameEn;
  dto.nameVi = service.nameVi;
  dto.slug = service.slug;

  return dto;
}

function mapMembershipLevelToSummary(
  level: MembershipLevel,
): CustomerLeadMembershipLevelSummaryDto {
  const dto = new CustomerLeadMembershipLevelSummaryDto();

  dto.id = level.id;
  dto.nameEn = level.nameEn;
  dto.nameVi = level.nameVi;
  dto.slug = level.slug;

  return dto;
}

export function mapCustomerLeadToResponse(
  lead: CustomerLead,
): CustomerLeadResponseDto {
  const dto = new CustomerLeadResponseDto();

  dto.id = lead.id;
  dto.fullName = lead.fullName ?? null;
  dto.phoneNumber = lead.phoneNumber;
  dto.source = lead.source;
  dto.preferredClub = lead.preferredClub
    ? mapClubToSummary(lead.preferredClub)
    : null;
  dto.preferredCallTime = lead.preferredCallTime ?? null;
  dto.age = lead.age ?? null;
  dto.gender = lead.gender ?? null;
  dto.heightCm = lead.heightCm ?? null;
  dto.weightKg = lead.weightKg ?? null;
  dto.bmiValue = lead.bmiValue ?? null;
  dto.bmiCategory = lead.bmiCategory ?? null;
  dto.interestedService = lead.interestedService
    ? mapServiceToSummary(lead.interestedService)
    : null;
  dto.interestedMembershipLevel = lead.interestedMembershipLevel
    ? mapMembershipLevelToSummary(lead.interestedMembershipLevel)
    : null;
  dto.status = lead.status;
  dto.internalNote = lead.internalNote ?? null;
  dto.consentAccepted = lead.consentAccepted;
  dto.consentAcceptedAt = lead.consentAcceptedAt ?? null;
  dto.metadata = mapMetadataToResponse(lead);

  return dto;
}

export function mapCustomerLeadsToResponses(
  leads: CustomerLead[],
): CustomerLeadResponseDto[] {
  return leads.map(mapCustomerLeadToResponse);
}

export function mapCustomerLeadToPublicResponse(
  lead: CustomerLead,
): PublicCustomerLeadResponseDto {
  const dto = new PublicCustomerLeadResponseDto();

  dto.id = lead.id;
  dto.bmiValue = lead.bmiValue ?? null;
  dto.bmiCategory = lead.bmiCategory ?? null;
  dto.status = lead.status;

  return dto;
}
