import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicFacilityResponseDto {
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

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty()
  displayOrder!: number;
}
