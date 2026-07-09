import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}

export class PublicPostCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nameEn!: string;

  @ApiProperty()
  nameVi!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionVi!: string | null;
}
