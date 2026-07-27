import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import type { EntityManager } from 'typeorm';

export type OrderingScope = Readonly<Record<string, string>>;

export interface OrderingCollection {
  tableName: string;
  scope?: OrderingScope;
}

export const OrderingCollections = {
  banners: (placement: string): OrderingCollection => ({
    tableName: 'banners',
    scope: { placement },
  }),
  clubs: { tableName: 'clubs' } satisfies OrderingCollection,
  facilities: { tableName: 'facilities' } satisfies OrderingCollection,
  mediaAssets: { tableName: 'media_assets' } satisfies OrderingCollection,
  membershipBenefits: {
    tableName: 'membership_benefits',
  } satisfies OrderingCollection,
  membershipLevels: {
    tableName: 'membership_levels',
  } satisfies OrderingCollection,
  membershipPlans: (levelId: string): OrderingCollection => ({
    tableName: 'membership_plans',
    scope: { membership_level_id: levelId },
  }),
  postCategories: {
    tableName: 'post_categories',
  } satisfies OrderingCollection,
  posts: (categoryId: string): OrderingCollection => ({
    tableName: 'posts',
    scope: { category_id: categoryId },
  }),
  services: { tableName: 'services' } satisfies OrderingCollection,
  serviceVariants: (serviceId: string): OrderingCollection => ({
    tableName: 'service_variants',
    scope: { service_id: serviceId },
  }),
  siteSettings: (group: string): OrderingCollection => ({
    tableName: 'site_settings',
    scope: { group },
  }),
} as const;

interface OrderedRow {
  id: string;
  displayOrder: number;
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function getCollectionKey(collection: OrderingCollection): string {
  const scope = Object.entries(collection.scope ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([column, value]) => `${column}=${value}`)
    .join('&');

  return scope ? `${collection.tableName}?${scope}` : collection.tableName;
}

function buildActiveWhere(
  collection: OrderingCollection,
  values: string[],
): string {
  const predicates = ['"deletedAt" IS NULL'];

  for (const [column, value] of Object.entries(collection.scope ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    values.push(value);
    predicates.push(`${quoteIdentifier(column)} = $${values.length}`);
  }

  return predicates.join(' AND ');
}

function parseOrderedRows(value: unknown): OrderedRow[] {
  if (!Array.isArray(value)) {
    throw new Error('Expected PostgreSQL ordering query to return rows.');
  }

  const rows: unknown[] = value;
  return rows.map((row) => {
    if (
      typeof row !== 'object' ||
      row === null ||
      !('id' in row) ||
      typeof row.id !== 'string' ||
      !('displayOrder' in row)
    ) {
      throw new Error('PostgreSQL returned an invalid ordering row.');
    }

    const displayOrder = Number(row.displayOrder);
    if (!Number.isInteger(displayOrder)) {
      throw new Error('PostgreSQL returned an invalid display order.');
    }

    return { id: row.id, displayOrder };
  });
}

async function lockScope(
  manager: EntityManager,
  collection: OrderingCollection,
): Promise<void> {
  await manager.query(
    'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
    ['ctg-display-order', getCollectionKey(collection)],
  );
}

async function getRows(
  manager: EntityManager,
  collection: OrderingCollection,
  forUpdate: boolean,
): Promise<OrderedRow[]> {
  const values: string[] = [];
  const where = buildActiveWhere(collection, values);
  const tableName = quoteIdentifier(collection.tableName);
  const lockClause = forUpdate ? ' FOR UPDATE' : '';
  const result: unknown = await manager.query(
    `SELECT "id", "display_order" AS "displayOrder"
       FROM ${tableName}
      WHERE ${where}
      ORDER BY "display_order" ASC, "createdAt" ASC, "id" ASC${lockClause}`,
    values,
  );

  return parseOrderedRows(result);
}

async function rewritePositions(
  manager: EntityManager,
  collection: OrderingCollection,
  orderedIds: readonly string[],
  updatedById: string,
): Promise<void> {
  if (orderedIds.length === 0) return;

  const tableName = quoteIdentifier(collection.tableName);
  const temporaryOffset = orderedIds.length + 1;

  await manager.query(
    `UPDATE ${tableName}
        SET "display_order" = "display_order" + $1
      WHERE "id" = ANY($2::uuid[])`,
    [temporaryOffset, orderedIds],
  );

  await manager.query(
    `WITH requested("id", "position") AS (
       SELECT "id", ("ordinality" - 1)::integer
         FROM unnest($1::uuid[]) WITH ORDINALITY AS input("id", "ordinality")
     )
     UPDATE ${tableName} AS target
        SET "display_order" = requested."position",
            "updatedAt" = CURRENT_TIMESTAMP,
            "updated_by" = $2
       FROM requested
      WHERE target."id" = requested."id"`,
    [orderedIds, updatedById],
  );
}

export async function getNextDisplayOrder(
  manager: EntityManager,
  collection: OrderingCollection,
): Promise<number> {
  await lockScope(manager, collection);
  const rows = await getRows(manager, collection, true);

  return rows.length;
}

export async function getOrderedIds(
  manager: EntityManager,
  collection: OrderingCollection,
): Promise<string[]> {
  const rows = await getRows(manager, collection, false);
  return rows.map((row) => row.id);
}

export async function reorderCollection(
  manager: EntityManager,
  collection: OrderingCollection,
  orderedIds: readonly string[],
  updatedById: string,
): Promise<void> {
  if (
    orderedIds.length === 0 ||
    new Set(orderedIds).size !== orderedIds.length
  ) {
    throw AppError.badRequest(AppErrorCode.ORDERING_IDS_INVALID);
  }

  await lockScope(manager, collection);
  const currentRows = await getRows(manager, collection, true);
  const currentIds = new Set(currentRows.map((row) => row.id));

  if (
    currentRows.length !== orderedIds.length ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    throw AppError.badRequest(AppErrorCode.ORDERING_COLLECTION_MISMATCH);
  }

  await rewritePositions(manager, collection, orderedIds, updatedById);
}

export async function compactCollection(
  manager: EntityManager,
  collection: OrderingCollection,
  updatedById: string,
): Promise<void> {
  await lockScope(manager, collection);
  const rows = await getRows(manager, collection, true);
  const alreadyContiguous = rows.every(
    (row, index) => row.displayOrder === index,
  );

  if (!alreadyContiguous) {
    await rewritePositions(
      manager,
      collection,
      rows.map((row) => row.id),
      updatedById,
    );
  }
}

export async function lockOrderingCollections(
  manager: EntityManager,
  collections: readonly OrderingCollection[],
): Promise<void> {
  const uniqueCollections = new Map(
    collections.map((collection) => [getCollectionKey(collection), collection]),
  );

  for (const [, collection] of [...uniqueCollections.entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    await lockScope(manager, collection);
  }
}
