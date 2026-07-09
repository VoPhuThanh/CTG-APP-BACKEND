import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MediaAssetType, MediaAssetUsage } from '../enums/media-asset.enum';

export class MediaAssetCreateDto {
  @ApiProperty({ example: 'Homepage hero background' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'People training at CTG Fitness' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altTextEn?: string;

  @ApiPropertyOptional({ example: 'Mọi người đang tập luyện tại CTG Fitness' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altTextVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiProperty({ example: 'https://example.com/assets/homepage-hero.jpg' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    enum: MediaAssetType,
    default: MediaAssetType.IMAGE,
  })
  @IsOptional()
  @IsEnum(MediaAssetType)
  type?: MediaAssetType;

  @ApiPropertyOptional({
    enum: MediaAssetUsage,
    default: MediaAssetUsage.GENERAL,
  })
  @IsOptional()
  @IsEnum(MediaAssetUsage)
  usage?: MediaAssetUsage;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ example: 1920 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({ example: 512000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
