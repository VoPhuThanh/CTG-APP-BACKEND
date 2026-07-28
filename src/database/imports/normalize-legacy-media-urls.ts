import { AppDataSource } from '../data-source';

interface NormalizeLegacyMediaUrlOptions {
  apply: boolean;
  fromBase: string;
  toBase: string;
}

interface LegacyUrlField {
  label: string;
  table: string;
  column: string;
  extraWhere?: string;
}

interface LegacyUrlFieldMatch extends LegacyUrlField {
  ids: string[];
}

interface ClubGalleryRow {
  id: string;
  gallery_image_urls: unknown;
}

interface ClubGalleryUpdate {
  id: string;
  urls: string[];
  changedCount: number;
}

const LEGACY_URL_FIELDS: readonly LegacyUrlField[] = [
  {
    label: 'mediaAssets.url',
    table: 'media_assets',
    column: 'url',
    extraWhere: '"storage_provider" IS NULL AND "storage_key" IS NULL',
  },
  { label: 'banners.imageUrl', table: 'banners', column: 'image_url' },
  {
    label: 'banners.mobileImageUrl',
    table: 'banners',
    column: 'mobile_image_url',
  },
  {
    label: 'clubs.coverImageUrl',
    table: 'clubs',
    column: 'cover_image_url',
  },
  {
    label: 'facilities.coverImageUrl',
    table: 'facilities',
    column: 'cover_image_url',
  },
  {
    label: 'membershipLevels.imageUrl',
    table: 'membership_levels',
    column: 'image_url',
  },
  { label: 'posts.coverImageUrl', table: 'posts', column: 'cover_image_url' },
  { label: 'services.imageUrl', table: 'services', column: 'image_url' },
  {
    label: 'serviceVariants.imageUrl',
    table: 'service_variants',
    column: 'image_url',
  },
  {
    label: 'serviceVariants.bannerImageUrl',
    table: 'service_variants',
    column: 'banner_image_url',
  },
  {
    label: 'serviceVariants.modelImageUrl',
    table: 'service_variants',
    column: 'model_image_url',
  },
  {
    label: 'siteSettings.value',
    table: 'site_settings',
    column: 'value',
    extraWhere: `"value_type" IN ('image_url', 'media_asset')`,
  },
] as const;

function readNamedArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function parseBaseUrl(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`--${name} is required.`);
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`--${name} must be a valid HTTP(S) URL.`);
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(`--${name} must be a plain HTTP(S) base URL.`);
  }

  const pathname = url.pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
  return `${url.origin}${pathname}`;
}

export function parseNormalizeLegacyMediaUrlArguments(): NormalizeLegacyMediaUrlOptions {
  return {
    apply: process.argv.includes('--apply'),
    fromBase: parseBaseUrl(readNamedArgument('from-base'), 'from-base'),
    toBase: parseBaseUrl(readNamedArgument('to-base'), 'to-base'),
  };
}

function assertSafeIdentifier(value: string): void {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error('Legacy media normalization has an unsafe identifier.');
  }
}

function buildPrefixWhere(
  field: LegacyUrlField,
  lengthParameter = 1,
  prefixParameter = 2,
): string {
  assertSafeIdentifier(field.table);
  assertSafeIdentifier(field.column);

  const prefixCondition = `LEFT(COALESCE("${field.column}", ''), $${lengthParameter}) = $${prefixParameter}`;
  return field.extraWhere
    ? `${prefixCondition} AND ${field.extraWhere}`
    : prefixCondition;
}

async function findStringFieldMatches(
  prefix: string,
): Promise<LegacyUrlFieldMatch[]> {
  const matches: LegacyUrlFieldMatch[] = [];

  for (const field of LEGACY_URL_FIELDS) {
    const rows = await AppDataSource.query<Array<{ id: string }>>(
      `SELECT "id" FROM "${field.table}" WHERE ${buildPrefixWhere(field)} ORDER BY "id"`,
      [prefix.length, prefix],
    );

    matches.push({ ...field, ids: rows.map((row) => row.id) });
  }

  return matches;
}

async function findClubGalleryUpdates(
  prefix: string,
  toBase: string,
): Promise<ClubGalleryUpdate[]> {
  const rows = await AppDataSource.query<ClubGalleryRow[]>(
    'SELECT "id", "gallery_image_urls" FROM "clubs" ORDER BY "id"',
  );
  const updates: ClubGalleryUpdate[] = [];

  for (const row of rows) {
    if (
      !Array.isArray(row.gallery_image_urls) ||
      !row.gallery_image_urls.every((value) => typeof value === 'string')
    ) {
      continue;
    }

    let changedCount = 0;
    const urls = row.gallery_image_urls.map((url) => {
      if (!url.startsWith(prefix)) return url;

      changedCount += 1;
      return `${toBase}/${url.slice(prefix.length)}`;
    });

    if (changedCount > 0) {
      updates.push({ id: row.id, urls, changedCount });
    }
  }

  return updates;
}

async function applyNormalization(
  options: NormalizeLegacyMediaUrlOptions,
  matches: LegacyUrlFieldMatch[],
  galleryUpdates: ClubGalleryUpdate[],
): Promise<void> {
  const prefix = `${options.fromBase}/`;

  await AppDataSource.transaction(async (manager) => {
    for (const match of matches) {
      if (match.ids.length === 0) continue;

      await manager.query(
        `UPDATE "${match.table}" SET "${match.column}" = $1 || SUBSTRING("${match.column}" FROM $2) WHERE ${buildPrefixWhere(match, 3, 4)}`,
        [options.toBase, options.fromBase.length + 1, prefix.length, prefix],
      );
    }

    for (const update of galleryUpdates) {
      await manager.query(
        'UPDATE "clubs" SET "gallery_image_urls" = $1::jsonb WHERE "id" = $2',
        [JSON.stringify(update.urls), update.id],
      );
    }
  });
}

export async function normalizeLegacyMediaUrls(): Promise<void> {
  const options = parseNormalizeLegacyMediaUrlArguments();
  const prefix = `${options.fromBase}/`;
  await AppDataSource.initialize();

  try {
    const matches = await findStringFieldMatches(prefix);
    const galleryUpdates = await findClubGalleryUpdates(prefix, options.toBase);
    const matchedStringValues = matches.reduce(
      (total, match) => total + match.ids.length,
      0,
    );
    const matchedGalleryValues = galleryUpdates.reduce(
      (total, update) => total + update.changedCount,
      0,
    );

    console.log(
      JSON.stringify({
        mode: options.apply ? 'apply' : 'dry-run',
        matched: matchedStringValues + matchedGalleryValues,
        fields: Object.fromEntries(
          matches
            .filter((match) => match.ids.length > 0)
            .map((match) => [match.label, match.ids]),
        ),
        clubGalleryImageUrls: galleryUpdates.map((update) => ({
          id: update.id,
          matched: update.changedCount,
        })),
      }),
    );

    if (!options.apply || matchedStringValues + matchedGalleryValues === 0) {
      return;
    }

    await applyNormalization(options, matches, galleryUpdates);

    console.log(
      JSON.stringify({
        mode: 'apply',
        updated: matchedStringValues + matchedGalleryValues,
      }),
    );
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  void normalizeLegacyMediaUrls().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown normalization error.';
    console.error(`Legacy media URL normalization failed: ${message}`);
    process.exitCode = 1;
  });
}
