import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipStatus } from '../enums/membership.enum';

export class MembershipPlanCreateDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  durationMonths!: number;

  @ApiProperty({
    example: '12000000.00',
    description:
      'Decimal string because TypeORM decimal columns return string.',
  })
  @IsNumberString()
  totalPrice!: string;

  @ApiPropertyOptional({ example: 'VND', default: 'VND' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: '12 months' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  labelEn?: string;

  @ApiPropertyOptional({ example: '12 tháng' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  labelVi?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: MembershipStatus,
    default: MembershipStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
