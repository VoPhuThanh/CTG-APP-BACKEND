import { PaginationQueryDto } from './pagination-query.dto';
import { PaginatedResponseDto } from './pagination-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export function getPaginationSkip(query: PaginationQueryDto): number {
  return (query.page - 1) * query.limit;
}

export function getPaginationTake(query: PaginationQueryDto): number {
  return query.limit;
}

export function buildPaginationMeta(
  query: PaginationQueryDto,
  totalItems: number,
): PaginationMetaDto {
  const totalPages = Math.ceil(totalItems / query.limit);

  return {
    page: query.page,
    limit: query.limit,
    totalItems,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  query: PaginationQueryDto,
): PaginatedResponseDto<T> {
  return {
    data,
    meta: buildPaginationMeta(query, totalItems),
  };
}
