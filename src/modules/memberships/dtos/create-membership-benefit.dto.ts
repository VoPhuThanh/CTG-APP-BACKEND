import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class MembershipBenefitCreateDto {
  @ApiProperty({ example: 'Access to all clubs' })
  @IsString()
  @MaxLength(150)
  nameEn!: string;

  @ApiProperty({ example: 'Truy cập tất cả câu lạc bộ' })
  @IsString()
  @MaxLength(150)
  nameVi!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
