import {
  MediaAssetSummaryResponseDto,
  PublicMediaAssetSummaryResponseDto,
} from '@/modules/media-assets/dtos/media-asset.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class ClubGalleryMediaInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  mediaAssetId!: string;

  @ApiProperty({ minimum: 0, example: 0 })
  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ClubGalleryMediaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  mediaAssetId!: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: MediaAssetSummaryResponseDto })
  mediaAsset!: MediaAssetSummaryResponseDto;
}

export class PublicClubGalleryMediaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: PublicMediaAssetSummaryResponseDto })
  mediaAsset!: PublicMediaAssetSummaryResponseDto;
}
