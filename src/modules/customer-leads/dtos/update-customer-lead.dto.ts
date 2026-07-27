import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
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
  CustomerLeadStatus,
} from '../enums/customer-lead.enum';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CustomerLeadUpdateDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: '0900000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    nullable: true,
    maxLength: 254,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string | null;

  @ApiPropertyOptional({ enum: CustomerLeadSource })
  @IsOptional()
  @IsEnum(CustomerLeadSource)
  source?: CustomerLeadSource;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  preferredClubId?: string | null;

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

  @ApiPropertyOptional({ example: '70.50' })
  @IsOptional()
  @IsNumberString()
  weightKg?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  interestedServiceId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  interestedMembershipLevelId?: string | null;

  @ApiPropertyOptional({ enum: CustomerLeadStatus })
  @IsOptional()
  @IsEnum(CustomerLeadStatus)
  status?: CustomerLeadStatus;

  @ApiPropertyOptional({
    example: 'Called once, customer asked to call again tomorrow.',
  })
  @IsOptional()
  @IsString()
  internalNote?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  consentAccepted?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the customer agrees to receive promotional content.',
  })
  @IsOptional()
  @IsBoolean()
  promotionConsentAccepted?: boolean;
}
