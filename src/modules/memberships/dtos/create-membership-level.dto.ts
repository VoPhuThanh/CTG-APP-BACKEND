import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipStatus } from '../enums/membership.enum';

export class MembershipLevelCreateDto {
  @ApiProperty({ example: 'Gold Membership' })
  @IsString()
  @MaxLength(150)
  nameEn!: string;

  @ApiProperty({ example: 'Gói hội viên Gold' })
  @IsString()
  @MaxLength(150)
  nameVi!: string;

  @ApiPropertyOptional({
    example: 'gold-membership',
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

  @ApiPropertyOptional({ example: 'https://example.com/gold.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: MembershipStatus,
    default: MembershipStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Benefit IDs assigned to this membership level.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  benefitIds?: string[];
}
