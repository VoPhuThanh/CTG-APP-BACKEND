import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PostStatus } from '../enums/post.enum';

export class PostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isFeatured?: 'true' | 'false';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'news' })
  @IsOptional()
  @IsString()
  categorySlug?: string;
}
