import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class PostCategoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';
}
