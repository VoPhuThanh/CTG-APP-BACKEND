import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ServiceSkillLevel, ServiceStatus } from '../enums/service.enum';

export class ServiceVariantUpdateDto {
  @ApiPropertyOptional({ example: 'Zumba' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'Zumba' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameVi?: string;

  @ApiPropertyOptional({ example: 'zumba' })
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
    example: 'https://example.com/zumba.jpg',
    nullable: true,
    description: 'Absolute HTTP(S) URL or a repository-local / public path.',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: '/images/services/zumba-banner.jpg',
    nullable: true,
    description: 'Absolute HTTP(S) URL or a repository-local / public path.',
  })
  @IsOptional()
  @IsString()
  bannerImageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/zumba-model.jpg',
    nullable: true,
    description: 'Absolute HTTP(S) URL or a repository-local / public path.',
  })
  @IsOptional()
  @IsString()
  modelImageUrl?: string | null;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(0)
  caloriesBurnedMin?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  caloriesBurnedMax?: number;

  @ApiPropertyOptional({ enum: ServiceSkillLevel })
  @IsOptional()
  @IsEnum(ServiceSkillLevel)
  skillLevel?: ServiceSkillLevel;

  @ApiPropertyOptional({ enum: ServiceStatus })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Replacement exact club availability. Omit to preserve; send [] to clear.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  clubIds?: string[];
}
