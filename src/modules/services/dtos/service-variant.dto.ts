import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceSkillLevel, ServiceStatus } from '../enums/service.enum';
import { ClubStatus } from '../../clubs/enums/club.enum';

export class ServiceVariantClubSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ClubStatus })
  status!: ClubStatus;
}

export class ServiceVariantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  serviceId!: string;

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

  @ApiPropertyOptional({ nullable: true })
  bannerImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  modelImageUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesBurnedMax!: number | null;

  @ApiProperty({ enum: ServiceSkillLevel })
  skillLevel!: ServiceSkillLevel;

  @ApiProperty({ enum: ServiceStatus })
  status!: ServiceStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [ServiceVariantClubSummaryDto] })
  clubs!: ServiceVariantClubSummaryDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
