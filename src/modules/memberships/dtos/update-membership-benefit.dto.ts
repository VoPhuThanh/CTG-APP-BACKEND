import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class MembershipBenefitUpdateDto {
  @ApiPropertyOptional({ example: 'Access to all clubs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'Truy cập tất cả câu lạc bộ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
