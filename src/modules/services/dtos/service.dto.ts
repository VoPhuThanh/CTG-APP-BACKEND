import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '../enums/service.enum';
import { ServiceVariantResponseDto } from './service-variant.dto';
import { ClubStatus } from '../../clubs/enums/club.enum';

export class ServiceClubSummaryDto {
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

export class ServiceResponseDto {
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

  @ApiProperty({ enum: ServiceStatus })
  status!: ServiceStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: [ServiceVariantResponseDto] })
  variants!: ServiceVariantResponseDto[];

  @ApiProperty({ type: [ServiceClubSummaryDto] })
  clubs!: ServiceClubSummaryDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
