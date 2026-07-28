import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ServiceStatus } from '../enums/service.enum';

export class ServiceCreateDto {
  @ApiProperty({ example: 'Dance' })
  @IsString()
  @MaxLength(150)
  nameEn!: string;

  @ApiProperty({ example: 'Nhảy' })
  @IsString()
  @MaxLength(150)
  nameVi!: string;

  @ApiPropertyOptional({
    example: 'dance',
    description: 'If omitted, slug is generated from nameEn.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/dance.jpg',
    deprecated: true,
    description:
      'Legacy fallback only. Prefer imageAssetId; consumers resolve imageAsset.url before this field.',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Managed media asset for the service card/selector image.',
  })
  @IsOptional()
  @IsUUID()
  imageAssetId?: string | null;

  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.DRAFT })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
