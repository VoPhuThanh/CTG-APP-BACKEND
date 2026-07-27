# Media Asset Reference and Deletion Lifecycle

## Selection boundary

All relational image assignments use the exported
`MediaAssetReferencesService` from `MediaAssetsModule`. Its consuming-service
interface is:

```ts
validateImageSelection(
  assetId: string | null | undefined,
  options?: {
    manager?: EntityManager;
    slot?: MediaAssetReferenceSlot;
    compatibleUsages?: readonly MediaAssetUsage[];
  },
): Promise<{
  asset: MediaAsset | null;
  warnings: Array<{
    code: 'MEDIA_ASSET.USAGE_MISMATCH';
    slot: MediaAssetReferenceSlot | null;
    assetUsage: MediaAssetUsage;
    compatibleUsages: MediaAssetUsage[];
  }>;
}>;
```

Rules are applied in this order:

1. null or omitted ID resolves to `{ asset: null, warnings: [] }`;
2. missing or soft-deleted row returns `404 MEDIA_ASSET.NOT_FOUND`;
3. a non-image returns `400 MEDIA_ASSET.NOT_IMAGE`;
4. an inactive image returns `400 MEDIA_ASSET.INACTIVE`;
5. an active image is accepted;
6. a mismatch with `compatibleUsages` returns a warning and logs it, but does
   not reject the assignment.

`usage` is organizational metadata only. It supports the existing media-list
filter and compatibility hints. It is never ownership, permission, or
placement authorization.

Update DTO omission preserves the current relation and therefore does not
revalidate it. Public and internal entity queries load the assigned relation
without an `isActive` predicate. This intentionally allows an already-assigned
asset to keep rendering after it is marked inactive.

Current consuming mutations pass their transaction manager to the validator.
The validator holds a pessimistic read lock on a selected media row until the
relation is saved; deletion holds the corresponding write lock while it checks
usage and soft-deletes. This prevents a selection from being committed across
the reference-check/delete boundary.

## Registered relational slots

| Entity type        | Stable slot                    | ID field                          |
| ------------------ | ------------------------------ | --------------------------------- |
| `banner`           | `banner.image`                 | `imageAssetId`                    |
| `banner`           | `banner.mobile_image`          | `mobileImageAssetId`              |
| `club`             | `club.cover_image`             | `coverImageAssetId`               |
| `club`             | `club.gallery_image`           | `galleryMedia`                    |
| `facility`         | `facility.cover_image`         | `coverImageAssetId`               |
| `membership_level` | `membership_level.image`       | `imageAssetId`                    |
| `service`          | `service.image`                | `imageAssetId`                    |
| `service_variant`  | `service_variant.image`        | `imageAssetId`                    |
| `service_variant`  | `service_variant.banner_image` | `bannerImageAssetId`              |
| `service_variant`  | `service_variant.model_image`  | `modelImageAssetId`               |
| `post`             | `post.cover_image`             | `coverImageAssetId`               |
| `post`             | `post.inline_content_image`    | `contentHtmlEn` / `contentHtmlVi` |
| `site_setting`     | `site_setting.media_asset`     | `mediaAssetId`                    |

Reference lookups include soft-deleted consuming records because their foreign
keys remain present. The foreign-key columns already have indexes from the
editorial-media migration. `IDX_media_assets_deleted_at` supports future
soft-deleted-candidate scans.

When a new relational media slot is introduced, it must be added to the entity,
migration/indexes, consuming validation call, and the centralized usage report
in the same change.

## CMS usage-report contract

```text
GET /media-assets/:id/usage
Permission: media-assets:read
```

Response:

```ts
{
  assetId: string;
  canDelete: boolean;
  totalReferences: number;
  references: Array<{
    entityType:
      | 'banner'
      | 'club'
      | 'facility'
      | 'membership_level'
      | 'service'
      | 'service_variant'
      | 'site_setting'
      | 'post';
    entityId: string;
    entityName: string | null;
    slot:
      | 'banner.image'
      | 'banner.mobile_image'
      | 'club.cover_image'
      | 'club.gallery_image'
      | 'facility.cover_image'
      | 'membership_level.image'
      | 'service.image'
      | 'service_variant.image'
      | 'service_variant.banner_image'
      | 'service_variant.model_image'
      | 'post.cover_image'
      | 'post.inline_content_image'
      | 'site_setting.media_asset';
    field:
      | 'imageAssetId'
      | 'bannerImageAssetId'
      | 'modelImageAssetId'
      | 'coverImageAssetId'
      | 'mobileImageAssetId'
      | 'galleryMedia'
      | 'mediaAssetId'
      | 'contentHtmlEn'
      | 'contentHtmlVi';
    locale?: 'en' | 'vi' | null;
  }>;
}
```

References are returned in deterministic entity-type, entity-ID, and slot
order. The CMS can show this report before deletion and link each reference to
the relevant editor.

## Safe deletion

```text
DELETE /media-assets/:id
Permission: media-assets:delete
```

The service locks the media row inside the deletion transaction and reads the
centralized reference registry. If references remain, it returns:

```ts
{
  statusCode: 409;
  code: 'MEDIA_ASSET.IN_USE';
  message: 'Media asset cannot be deleted while it is referenced.';
  details: {
    assetId: string;
    canDelete: false;
    totalReferences: number;
    references: MediaAssetReference[];
    usageUrl: `/media-assets/${string}/usage`;
  };
}
```

The backend never cascades content deletion and never clears image fields as a
side effect. With no references, it records `deletedBy` and soft-deletes the
media row. It does not call `StorageProvider.delete`.

## Delayed physical cleanup boundary

There is intentionally no public purge endpoint and no scheduled cleanup job
in this phase. `MediaAssetOrphanCleanupService` exposes only this assessment:

```ts
assessForPhysicalDeletion(
  assetId: string,
  deletedBefore: Date,
): Promise<{
  assetId: string;
  eligible: boolean;
  storageProvider: string | null;
  storageKey: string | null;
  deletedAt: Date | null;
  referenceCount: number;
  reasons: string[];
}>;
```

A future internal job must supply an operational retention cutoff, select only
`eligible: true` assets, and recheck references immediately before deleting the
physical object. Provider failures must be retryable and audited. Database and
storage deletion must not be presented as one atomic transaction.

## Inline post images

Managed post images use canonical `data-media-asset-id` markers and the
`post_inline_media_assets` join table. References are synchronized in the same
transaction as the post write, separated by `en` and `vi`, and included in
usage/deletion protection. Repeating an asset in one locale creates one row;
using it in both locales creates two rows.

An asset must exist, be non-deleted, be an image, and be active when first
referenced by a locale. If an already-referenced asset later becomes inactive,
the existing locale reference remains valid so published content does not
break. Soft deletion remains blocked while any inline reference exists.
