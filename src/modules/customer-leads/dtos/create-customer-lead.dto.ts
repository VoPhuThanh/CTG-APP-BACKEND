import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CustomerLeadGender,
  CustomerLeadSource,
} from '../enums/customer-lead.enum';

export class CustomerLeadCreateDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiProperty({ example: '0900000000' })
  @IsString()
  @MaxLength(30)
  phoneNumber!: string;

  @ApiProperty({
    enum: CustomerLeadSource,
    example: CustomerLeadSource.BMI_FORM,
  })
  @IsEnum(CustomerLeadSource)
  source!: CustomerLeadSource;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Preferred club selected from the form.',
  })
  @IsOptional()
  @IsUUID()
  preferredClubId?: string;

  @ApiPropertyOptional({ example: 'Weekday evening' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredCallTime?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: CustomerLeadGender })
  @IsOptional()
  @IsEnum(CustomerLeadGender)
  gender?: CustomerLeadGender;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({
    example: '70.50',
    description:
      'Decimal string because TypeORM decimal columns return string.',
  })
  @IsOptional()
  @IsNumberString()
  weightKg?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Service selected from the form.',
  })
  @IsOptional()
  @IsUUID()
  interestedServiceId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Membership level selected from the form.',
  })
  @IsOptional()
  @IsUUID()
  interestedMembershipLevelId?: string;

  @ApiProperty({
    example: true,
    description: 'User must accept consent before submitting the form.',
  })
  @Equals(true)
  consentAccepted!: true;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the customer agrees to receive promotional content.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  promotionConsentAccepted?: boolean;
}
