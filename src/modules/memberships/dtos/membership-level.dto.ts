import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipStatus } from '../enums/membership.enum';
import { MembershipBenefitResponseDto } from './membership-benefit.dto';
import { MembershipPlanResponseDto } from './membership-plan.dto';

export class MembershipLevelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ enum: MembershipStatus })
  status!: MembershipStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: [MembershipPlanResponseDto] })
  plans!: MembershipPlanResponseDto[];

  @ApiProperty({ type: [MembershipBenefitResponseDto] })
  benefits!: MembershipBenefitResponseDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
