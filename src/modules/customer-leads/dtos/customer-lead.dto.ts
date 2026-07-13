import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BmiCategory,
  CustomerLeadGender,
  CustomerLeadSource,
  CustomerLeadStatus,
} from '../enums/customer-lead.enum';

export class CustomerLeadClubSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;
}

export class CustomerLeadServiceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;
}

export class CustomerLeadMembershipLevelSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;
}

export class CustomerLeadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty({ enum: CustomerLeadSource })
  source!: CustomerLeadSource;

  @ApiPropertyOptional({ type: CustomerLeadClubSummaryDto, nullable: true })
  preferredClub!: CustomerLeadClubSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  preferredCallTime!: string | null;

  @ApiPropertyOptional({ nullable: true })
  age!: number | null;

  @ApiPropertyOptional({ enum: CustomerLeadGender, nullable: true })
  gender!: CustomerLeadGender | null;

  @ApiPropertyOptional({ nullable: true })
  heightCm!: number | null;

  @ApiPropertyOptional({ nullable: true })
  weightKg!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bmiValue!: string | null;

  @ApiPropertyOptional({ enum: BmiCategory, nullable: true })
  bmiCategory!: BmiCategory | null;

  @ApiPropertyOptional({ type: CustomerLeadServiceSummaryDto, nullable: true })
  interestedService!: CustomerLeadServiceSummaryDto | null;

  @ApiPropertyOptional({
    type: CustomerLeadMembershipLevelSummaryDto,
    nullable: true,
  })
  interestedMembershipLevel!: CustomerLeadMembershipLevelSummaryDto | null;

  @ApiProperty({ enum: CustomerLeadStatus })
  status!: CustomerLeadStatus;

  @ApiPropertyOptional({ nullable: true })
  internalNote!: string | null;

  @ApiProperty()
  consentAccepted!: boolean;

  @ApiPropertyOptional({ nullable: true })
  consentAcceptedAt!: Date | null;

  @ApiProperty()
  metadata!: MetadataResponseDto;

  @ApiProperty()
  promotionConsentAccepted!: boolean;
}

export class PublicCustomerLeadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  bmiValue!: string | null;

  @ApiPropertyOptional({ enum: BmiCategory, nullable: true })
  bmiCategory!: BmiCategory | null;

  @ApiProperty()
  status!: CustomerLeadStatus;
}
