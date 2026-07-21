import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BannerPlacement, BannerStatus } from '../enums/banner.enum';

export class BannerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BannerPlacement })
  @IsOptional()
  @IsEnum(BannerPlacement)
  placement?: BannerPlacement;

  @ApiPropertyOptional({ enum: BannerStatus })
  @IsOptional()
  @IsEnum(BannerStatus)
  status?: BannerStatus;
}

export class PublicBannerPlacementQueryDto {
  @ApiProperty({
    enum: BannerPlacement,
    description: 'Canonical public page or carousel placement.',
  })
  @IsEnum(BannerPlacement)
  placement!: BannerPlacement;
}
