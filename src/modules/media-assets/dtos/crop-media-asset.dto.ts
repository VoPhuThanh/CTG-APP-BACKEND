import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const MEDIA_CROP_ROTATIONS = [0, 90, 180, 270] as const;
export type MediaCropRotation = (typeof MEDIA_CROP_ROTATIONS)[number];

export interface AppliedCropMetadata {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: MediaCropRotation;
  aspectRatio: number | null;
  outputFormat: 'webp';
  quality: number;
}

export class CropMediaAssetDto {
  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  x!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  y!: number;

  @ApiProperty({ minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width!: number;

  @ApiProperty({ minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height!: number;

  @ApiPropertyOptional({
    enum: MEDIA_CROP_ROTATIONS,
    default: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(MEDIA_CROP_ROTATIONS)
  rotation?: MediaCropRotation;

  @ApiPropertyOptional({ nullable: true, minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.000001)
  aspectRatio?: number | null;

  @ApiPropertyOptional({ enum: ['webp'], default: 'webp' })
  @IsOptional()
  @IsIn(['webp'])
  outputFormat?: 'webp';

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 85 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;
}

function parseMultipartCrop({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;

  try {
    return plainToInstance(CropMediaAssetDto, JSON.parse(value) as object);
  } catch {
    return value;
  }
}

export class OptionalMultipartCropDto {
  @ApiPropertyOptional({
    type: CropMediaAssetDto,
    description: 'JSON-encoded crop instructions.',
  })
  @IsOptional()
  @Transform(parseMultipartCrop)
  @IsObject()
  @ValidateNested()
  @Type(() => CropMediaAssetDto)
  crop?: CropMediaAssetDto;
}
