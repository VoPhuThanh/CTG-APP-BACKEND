import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class MembershipLevelUpdateDto {
  @ApiPropertyOptional({ example: 'Gold Membership' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'Gói hội viên Gold' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameVi?: string;

  @ApiPropertyOptional({ example: 'gold-membership' })
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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Replacement benefit ID list. Send [] to clear assigned benefits.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  benefitIds?: string[];
}
