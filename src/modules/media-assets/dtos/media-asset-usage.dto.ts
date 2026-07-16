import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  MediaAssetReferenceEntityType,
  MediaAssetReferenceSlot,
} from '../enums/media-asset-reference.enum';

export class MediaAssetReferenceResponseDto {
  @ApiProperty({ enum: MediaAssetReferenceEntityType })
  entityType!: MediaAssetReferenceEntityType;

  @ApiProperty({ format: 'uuid' })
  entityId!: string;

  @ApiPropertyOptional({ nullable: true })
  entityName!: string | null;

  @ApiProperty({
    enum: MediaAssetReferenceSlot,
    description: 'Stable semantic placement slot.',
  })
  slot!: MediaAssetReferenceSlot;

  @ApiProperty({
    description: 'Request/entity property that stores the media asset ID.',
  })
  field!: string;
}

export class MediaAssetUsageReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  assetId!: string;

  @ApiProperty()
  canDelete!: boolean;

  @ApiProperty()
  totalReferences!: number;

  @ApiProperty({ type: MediaAssetReferenceResponseDto, isArray: true })
  references!: MediaAssetReferenceResponseDto[];
}

export class MediaAssetInUseErrorDetailsDto extends MediaAssetUsageReportResponseDto {
  @ApiProperty({ example: '/media-assets/5e8e7b84-56cb-4db1-82ba/usage' })
  usageUrl!: string;
}

export class MediaAssetInUseErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'MEDIA_ASSET.IN_USE' })
  code!: string;

  @ApiProperty({
    example: 'Media asset cannot be deleted while it is referenced.',
  })
  message!: string;

  @ApiProperty({ type: MediaAssetInUseErrorDetailsDto })
  details!: MediaAssetInUseErrorDetailsDto;
}
