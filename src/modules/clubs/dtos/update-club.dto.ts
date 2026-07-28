import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ClubStatus } from '../enums/club.enum';
import { ClubGalleryMediaInputDto } from './club-gallery-media.dto';

export class ClubUpdateDto {
  @ApiPropertyOptional({ example: 'CTG Fitness District 1' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'CTG Fitness Quận 1' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameVi?: string;

  @ApiPropertyOptional({ example: 'ctg-fitness-district-1' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: '123 Example Street, District 1' })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiPropertyOptional({ example: '123 Đường Ví Dụ, Quận 1' })
  @IsOptional()
  @IsString()
  addressVi?: string;

  @ApiPropertyOptional({ example: 'Mon - Sun: 6:00 AM - 10:00 PM' })
  @IsOptional()
  @IsString()
  openingHoursTextEn?: string;

  @ApiPropertyOptional({ example: 'Thứ 2 - Chủ nhật: 6:00 - 22:00' })
  @IsOptional()
  @IsString()
  openingHoursTextVi?: string;

  @ApiPropertyOptional({ example: ['0900000000'], type: [String] })
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
    example: ['https://example.com/club-1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageUrls?: string[];

  @ApiPropertyOptional({
    type: [ClubGalleryMediaInputDto],
    description:
      'Replacement managed gallery. Omit to preserve; send [] to clear. Orders must be consecutive from 0.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: ClubGalleryMediaInputDto) => item.mediaAssetId)
  @ArrayUnique((item: ClubGalleryMediaInputDto) => item.displayOrder)
  @ValidateNested({ each: true })
  @Type(() => ClubGalleryMediaInputDto)
  galleryMedia?: ClubGalleryMediaInputDto[];

  @ApiPropertyOptional({ enum: ClubStatus })
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Replacement facility ID list. Send [] to clear assigned facilities.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  facilityIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Replacement service ID list. Send [] to clear assigned services.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  serviceIds?: string[];
}
