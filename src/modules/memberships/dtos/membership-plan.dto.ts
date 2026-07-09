import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipStatus } from '../enums/membership.enum';

export class MembershipPlanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  levelId!: string;

  @ApiProperty()
  durationMonths!: number;

  @ApiProperty()
  totalPrice!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  labelEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  labelVi!: string | null;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ enum: MembershipStatus })
  status!: MembershipStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
