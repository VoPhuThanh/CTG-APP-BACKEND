import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ServiceSkillLevel, ServiceStatus } from '../enums/service.enum';

export class ServiceVariantCreateDto {
  @ApiProperty({ example: 'Zumba' })
  @IsString()
  @MaxLength(150)
  nameEn!: string;

  @ApiProperty({ example: 'Zumba' })
  @IsString()
  @MaxLength(150)
  nameVi!: string;

  @ApiProperty({ example: 'zumba' })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug!: string;

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

  @ApiPropertyOptional({ example: 'https://example.com/zumba.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

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

  @ApiPropertyOptional({
    enum: ServiceSkillLevel,
    default: ServiceSkillLevel.ALL_LEVELS,
  })
  @IsOptional()
  @IsEnum(ServiceSkillLevel)
  skillLevel?: ServiceSkillLevel;

  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.DRAFT })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
