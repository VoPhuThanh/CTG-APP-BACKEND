import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CustomerLeadGender,
  CustomerLeadSource,
} from '../enums/customer-lead.enum';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CustomerLeadCreateDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @Transform(trimString)
  @ValidateIf(
    (dto: CustomerLeadCreateDto) =>
      dto.source === CustomerLeadSource.CONTACT_FORM ||
      dto.fullName !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName?: string;

  @ApiProperty({ example: '0900000000' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber!: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    maxLength: 254,
    description: 'Required when source is contact_form.',
  })
  @Transform(trimString)
  @ValidateIf(
    (dto: CustomerLeadCreateDto) =>
      dto.source === CustomerLeadSource.CONTACT_FORM || dto.email !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: 'I would like more information about membership options.',
    maxLength: 5000,
    description: 'Required when source is contact_form.',
  })
  @Transform(trimString)
  @ValidateIf(
    (dto: CustomerLeadCreateDto) =>
      dto.source === CustomerLeadSource.CONTACT_FORM ||
      dto.message !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message?: string;

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
