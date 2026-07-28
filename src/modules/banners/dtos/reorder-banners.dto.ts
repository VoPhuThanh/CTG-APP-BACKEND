import { ReorderCollectionDto } from '@/cores/ordering/dtos/reorder-collection.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BannerPlacement } from '../enums/banner.enum';

export class BannerReorderQueryDto {
  @ApiProperty({ enum: BannerPlacement })
  @IsEnum(BannerPlacement)
  placement!: BannerPlacement;
}

export class BannerReorderDto extends ReorderCollectionDto {
  @ApiProperty({ enum: BannerPlacement })
  @IsEnum(BannerPlacement)
  placement!: BannerPlacement;
}
