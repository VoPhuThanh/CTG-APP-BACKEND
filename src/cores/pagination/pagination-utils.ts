import { PaginationQueryDto } from './pagination-query.dto';
import { PaginatedResponseDto } from './pagination-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PaginatedIdsResult {
  ids: string[];
  totalItems: number;
}

export function getPaginationSkip(query: PaginationQueryDto): number {
  return (query.page - 1) * query.limit;
}

export function getPaginationTake(query: PaginationQueryDto): number {
  return query.limit;
}

/**
 * Counts and paginates root entity IDs before collection relations are loaded.
 *
 * The supplied query builder may join to-one relations needed for filtering or
 * sorting, but it must not join to-many collections because those joins can
 * multiply root rows before LIMIT/OFFSET is applied.
 */
export async function getPaginatedIds<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  rootAlias: string,
  query: PaginationQueryDto,
): Promise<PaginatedIdsResult> {
  const totalItems = await queryBuilder.clone().getCount();
  const rows = await queryBuilder
    .clone()
    .select(`${rootAlias}.id`, 'id')
    .offset(getPaginationSkip(query))
    .limit(getPaginationTake(query))
    .getRawMany<{ id: string }>();

  return {
    ids: rows.map((row) => row.id),
    totalItems,
  };
}

export function orderEntitiesByIds<T extends { id: string }>(
  entities: T[],
  ids: string[],
): T[] {
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));

  return ids.flatMap((id) => {
    const entity = entitiesById.get(id);
    return entity ? [entity] : [];
  });
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
