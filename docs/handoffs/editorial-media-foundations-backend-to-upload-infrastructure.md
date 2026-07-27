# Editorial Media Foundations: Upload-Infrastructure Handoff

> Status: completed by the managed-upload phase. See `docs/MEDIA_STORAGE.md`
> and `docs/handoffs/managed-media-upload-backend-to-cms-and-modules.md` for the
> live contract and consumer handoff.

## Completed backend foundation

The backend now has additive schema and response contracts for managed
editorial images and database-stored bilingual post HTML. This phase does not
store binary data or move existing files.

Migration order:

```text
1784091600000-add-service-variant-detail.ts
1784178000000-add-editorial-media-foundations.ts
```

The new migration class is
`AddEditorialMediaFoundations1784178000000`.

## Exact new columns

`media_assets`:

- `storage_key varchar(1024) null`, with uniqueness for non-null values through
  PostgreSQL index `UQ_media_assets_storage_key` (multiple nulls remain valid);
- `original_filename varchar(255) null`;
- `checksum varchar(128) null`, indexed by `IDX_media_assets_checksum`.

Consuming tables:

- `services.image_asset_id uuid null`;
- `service_variants.image_asset_id uuid null`;
- `service_variants.banner_image_asset_id uuid null`;
- `service_variants.model_image_asset_id uuid null`;
- `posts.cover_image_asset_id uuid null`;
- `posts.content_html_en text null`;
- `posts.content_html_vi text null`.

Each asset ID column is indexed and has a foreign key to `media_assets.id` with
`ON DELETE SET NULL ON UPDATE CASCADE`.

## Entity relations and request properties

| Entity           | Relation           | Nullable UUID request property |
| ---------------- | ------------------ | ------------------------------ |
| `Service`        | `imageAsset`       | `imageAssetId`                 |
| `ServiceVariant` | `imageAsset`       | `imageAssetId`                 |
| `ServiceVariant` | `bannerImageAsset` | `bannerImageAssetId`           |
| `ServiceVariant` | `modelImageAsset`  | `modelImageAssetId`            |
| `Post`           | `coverImageAsset`  | `coverImageAssetId`            |

Requests validate UUID shape. Services resolve the relation and reject a
missing/soft-deleted asset with `MEDIA_ASSET.NOT_FOUND` or a non-image asset with
`MEDIA_ASSET.NOT_IMAGE`. Update omission preserves the relation; explicit null
clears it.

Post create/update additionally accept nullable `contentHtmlEn` and
`contentHtmlVi` strings.

## MediaAsset request/response additions

Internal media create/update contracts accept:

```ts
storageKey?: string | null;
originalFilename?: string | null;
checksum?: string | null;
```

Create uses omission rather than explicit null in its TypeScript shape, while
all three database columns and internal response properties are nullable.
`url` remains required because it is still the public render representation.

The upload layer should write a stable provider-independent object key, the
original client filename, checksum, public URL, MIME type, dimensions, and file
size after storage succeeds. It must not write binary data to PostgreSQL.

## Consumer response additions

Internal service, variant, and post responses expose each selected asset ID and
its nullable `MediaAssetSummaryResponseDto`. Public responses expose the same
slot as a nullable `PublicMediaAssetSummaryResponseDto` containing exactly:

```ts
{
  id: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
}
```

The backend loads these relations as part of the consuming entity query. The
CMS/public frontend must not query `/media-assets/public` to infer placement.

## Compatibility fields that must remain

Do not remove or reinterpret these fields during upload-infrastructure work:

- `services.image_url` / `imageUrl`;
- `service_variants.image_url` / `imageUrl`;
- `service_variants.banner_image_url` / `bannerImageUrl`;
- `service_variants.model_image_url` / `modelImageUrl`;
- `posts.cover_image_url` / `coverImageUrl`;
- `posts.content_url_en` / `contentUrlEn`;
- `posts.content_url_vi` / `contentUrlVi`;
- all currently deferred banner, club, facility, membership, and site-setting
  URL fields.

The adopted legacy URL response properties are marked deprecated in Swagger;
this is migration guidance, not authorization to remove them.

No legacy URL/path was backfilled into `MediaAsset`. Import must move or copy
the underlying file to managed storage first, then create the media record and
assign its fixed-slot foreign key.

## Upload-infrastructure phase requirements

The next phase should add storage-provider configuration, upload validation,
object-key generation, checksum calculation, metadata extraction, durable
cleanup/rollback behavior, and protected upload endpoints. It should preserve
the existing permission model and structured errors, and must not treat
`MediaAssetUsage` as placement.

Define behavior for replacement, failed database writes after upload, failed
object deletion, duplicate checksums, allowed MIME types, size/dimension limits,
and public URL generation before implementation. Do not broadly migrate CMS
forms in the infrastructure phase unless separately authorized.

## Deferred adoption batches

- Banner desktop/mobile fixed slots.
- Club cover plus an ordered club-media join entity for galleries.
- Facility cover.
- Membership-level image.
- Image-valued site settings after their dynamic semantics are defined.

Club galleries must not become JSON arrays of asset IDs or a polymorphic
attachment table. Existing repository-relative/public paths cannot be
backfilled without importing their files.
