import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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

  @ApiPropertyOptional({ enum: CustomerLeadSource })
  @IsOptional()
  @IsEnum(CustomerLeadSource)
  source?: CustomerLeadSource;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
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

  @ApiPropertyOptional({ example: '70.50' })
  @IsOptional()
  @IsNumberString()
  weightKg?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  interestedServiceId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  interestedMembershipLevelId?: string;

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
}
