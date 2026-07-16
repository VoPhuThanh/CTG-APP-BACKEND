import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmpty,
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

  @ApiHideProperty()
  @IsEmpty({
    message: 'storageProvider is server-managed; use the upload route',
  })
  storageProvider?: never;

  @ApiHideProperty()
  @IsEmpty({ message: 'storageKey is server-managed; use the upload route' })
  storageKey?: never;

  @ApiHideProperty()
  @IsEmpty({
    message: 'originalFilename is server-managed; use the upload route',
  })
  originalFilename?: never;

  @ApiHideProperty()
  @IsEmpty({ message: 'checksum is server-managed; use the upload route' })
  checksum?: never;

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
