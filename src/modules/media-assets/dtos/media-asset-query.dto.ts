import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { MediaAssetType, MediaAssetUsage } from '../enums/media-asset.enum';

export class MediaAssetQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MediaAssetType })
  @IsOptional()
  @IsEnum(MediaAssetType)
  type?: MediaAssetType;

  @ApiPropertyOptional({ enum: MediaAssetUsage })
  @IsOptional()
  @IsEnum(MediaAssetUsage)
  usage?: MediaAssetUsage;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'Filter by active state. Use true or false.',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';
}
