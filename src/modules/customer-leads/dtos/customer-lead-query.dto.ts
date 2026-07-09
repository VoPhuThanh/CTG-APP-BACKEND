import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  CustomerLeadSource,
  CustomerLeadStatus,
} from '../enums/customer-lead.enum';

export class CustomerLeadQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CustomerLeadSource })
  @IsOptional()
  @IsEnum(CustomerLeadSource)
  source?: CustomerLeadSource;

  @ApiPropertyOptional({ enum: CustomerLeadStatus })
  @IsOptional()
  @IsEnum(CustomerLeadStatus)
  status?: CustomerLeadStatus;
}
