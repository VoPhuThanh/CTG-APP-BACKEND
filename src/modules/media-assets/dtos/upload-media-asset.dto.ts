import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MediaAssetUsage } from '../enums/media-asset.enum';

function parseMultipartBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class MediaAssetUploadDto {
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

  @ApiPropertyOptional({
    enum: MediaAssetUsage,
    default: MediaAssetUsage.GENERAL,
  })
  @IsOptional()
  @IsEnum(MediaAssetUsage)
  usage?: MediaAssetUsage;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(parseMultipartBoolean)
  @IsBoolean()
  isActive?: boolean;
}
