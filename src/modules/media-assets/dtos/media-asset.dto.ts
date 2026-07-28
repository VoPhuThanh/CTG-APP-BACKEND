import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaAssetType, MediaAssetUsage } from '../enums/media-asset.enum';
import {
  CropMediaAssetDto,
  type AppliedCropMetadata,
} from './crop-media-asset.dto';

export class MediaAssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  altTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  altTextVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  storageProvider!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bucket!: string | null;

  @ApiPropertyOptional({ nullable: true })
  storageKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  originalFilename!: string | null;

  @ApiPropertyOptional({ nullable: true })
  checksum!: string | null;

  @ApiProperty()
  hasOriginal!: boolean;

  @ApiPropertyOptional({ nullable: true })
  originalMimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  originalWidth!: number | null;

  @ApiPropertyOptional({ nullable: true })
  originalHeight!: number | null;

  @ApiPropertyOptional({ nullable: true })
  originalFileSizeBytes!: number | null;

  @ApiPropertyOptional({ type: CropMediaAssetDto, nullable: true })
  cropMetadata!: AppliedCropMetadata | null;

  @ApiProperty({ enum: MediaAssetType })
  type!: MediaAssetType;

  @ApiProperty({ enum: MediaAssetUsage })
  usage!: MediaAssetUsage;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;

  @ApiPropertyOptional({ nullable: true })
  fileSizeBytes!: number | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}

export class PublicMediaAssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  altTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  altTextVi!: string | null;

  @ApiProperty()
  url!: string;

  @ApiProperty({ enum: MediaAssetType })
  type!: MediaAssetType;

  @ApiProperty({ enum: MediaAssetUsage })
  usage!: MediaAssetUsage;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;
}

export class MediaAssetSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  altTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  altTextVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiProperty()
  isActive!: boolean;
}

export class PublicMediaAssetSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  altTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  altTextVi!: string | null;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;
}
