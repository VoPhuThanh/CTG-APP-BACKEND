import { ReorderCollectionDto } from '@/cores/ordering/dtos/reorder-collection.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SiteSettingReorderQueryDto {
  @ApiProperty({ example: 'general', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  group!: string;
}

export class SiteSettingReorderDto extends ReorderCollectionDto {
  @ApiProperty({ example: 'general', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  group!: string;
}
