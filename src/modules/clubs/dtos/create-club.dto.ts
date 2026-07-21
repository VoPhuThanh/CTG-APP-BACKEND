import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { ClubStatus } from '../enums/club.enum';
import { ClubGalleryMediaInputDto } from './club-gallery-media.dto';

export class ClubCreateDto {
  @ApiProperty({ example: 'CTG Fitness District 1' })
  @IsString()
  @MaxLength(150)
  nameEn!: string;

  @ApiProperty({ example: 'CTG Fitness Quận 1' })
  @IsString()
  @MaxLength(150)
  nameVi!: string;

  @ApiPropertyOptional({
    example: 'ctg-fitness-district-1',
    description: 'If omitted, slug is generated from nameEn.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug?: string;

  @ApiProperty({ example: '123 Example Street, District 1, Ho Chi Minh City' })
  @IsString()
  addressEn!: string;

  @ApiProperty({ example: '123 Đường Ví Dụ, Quận 1, TP. Hồ Chí Minh' })
  @IsString()
  addressVi!: string;

  @ApiPropertyOptional({ example: 'Mon - Sun: 6:00 AM - 10:00 PM' })
  @IsOptional()
  @IsString()
  openingHoursTextEn?: string;

  @ApiPropertyOptional({ example: 'Thứ 2 - Chủ nhật: 6:00 - 22:00' })
  @IsOptional()
  @IsString()
  openingHoursTextVi?: string;

  @ApiPropertyOptional({
    example: ['0900000000', '0911111111'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbers?: string[];

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
    example: 'https://example.com/club-cover.jpg',
    deprecated: true,
    description: 'Legacy fallback only. Prefer coverImageAssetId.',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  coverImageAssetId?: string | null;

  @ApiPropertyOptional({
    example: [
      'https://example.com/club-1.jpg',
      'https://example.com/club-2.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageUrls?: string[];

  @ApiPropertyOptional({
    type: [ClubGalleryMediaInputDto],
    description:
      'Ordered managed gallery. Asset IDs and displayOrder values must be unique; orders must be consecutive from 0.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: ClubGalleryMediaInputDto) => item.mediaAssetId)
  @ArrayUnique((item: ClubGalleryMediaInputDto) => item.displayOrder)
  @ValidateNested({ each: true })
  @Type(() => ClubGalleryMediaInputDto)
  galleryMedia?: ClubGalleryMediaInputDto[];

  @ApiPropertyOptional({ enum: ClubStatus, default: ClubStatus.DRAFT })
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Facility IDs assigned to this club.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  facilityIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Service IDs assigned to this club.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  serviceIds?: string[];
}
