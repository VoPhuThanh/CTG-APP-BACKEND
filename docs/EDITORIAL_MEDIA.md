# Editorial Media and Post HTML Contract

## Scope

This document describes the additive schema/API foundation introduced by
`AddEditorialMediaFoundations1784178000000`. It does not implement multipart
uploads, object-storage clients, file movement, HTML sanitization, or a broad
CMS form migration.

The later managed-upload phase is now implemented. Its live configuration,
endpoint, validation, provider boundary, and cleanup contract are documented in
`docs/MEDIA_STORAGE.md`. This document remains authoritative for the Prompt 1
relationship and compatibility-field design.

## Live editorial image inventory

| Domain            | Existing field                     | Classification                             | This batch                                   |
| ----------------- | ---------------------------------- | ------------------------------------------ | -------------------------------------------- |
| Media assets      | `url`                              | Public representation of the media record  | Retained                                     |
| Services          | `imageUrl`                         | Fixed service card/selector slot           | Adopted as `imageAsset`                      |
| Service variants  | `imageUrl`                         | Fixed variant card slot                    | Adopted as `imageAsset`                      |
| Service variants  | `bannerImageUrl`                   | Fixed detail banner slot                   | Adopted as `bannerImageAsset`                |
| Service variants  | `modelImageUrl`                    | Fixed model/cutout slot                    | Adopted as `modelImageAsset`                 |
| Posts             | `coverImageUrl`                    | Fixed post cover slot                      | Adopted as `coverImageAsset`                 |
| Posts             | `contentUrlEn`, `contentUrlVi`     | Legacy external/file-backed HTML locations | Retained alongside database HTML             |
| Banners           | `imageUrl`, `mobileImageUrl`       | Fixed desktop/mobile slots                 | Adopted as `imageAsset` / `mobileImageAsset` |
| Clubs             | `coverImageUrl`                    | Fixed club cover slot                      | Adopted as `coverImageAsset`                 |
| Clubs             | `galleryImageUrls`                 | Ordered gallery                            | Adopted through explicit ordered join rows   |
| Facilities        | `coverImageUrl`                    | Fixed facility cover slot                  | Adopted as `coverImageAsset`                 |
| Membership levels | `imageUrl`                         | Fixed membership artwork slot              | Adopted as `imageAsset`                      |
| Site settings     | `value` with `valueType=image_url` | Legacy dynamic image URL                   | Retained; new settings can use `media_asset` |

No frontend-owned UI assets are stored in backend entity columns. UI icons,
logos, and build-time assets remain frontend concerns and must not be imported
as editorial media by this migration.

## MediaAsset storage metadata

The upload layer may write:

- `storageKey: string | null` - stable provider-independent object key, unique
  when present; null is transitional support for legacy external records;
- `originalFilename: string | null` - client filename retained as metadata;
- `checksum: string | null` - integrity/deduplication input, indexed but not
  unique because duplicate content may be intentionally represented by
  separate records.

Existing `url`, MIME type, dimensions, file size, active state, bilingual alt
text/descriptions, usage, display order, soft-delete, and audit metadata remain.
PostgreSQL stores metadata only, never binary file data.

`MediaAssetUsage` is an organizational filter. It does not identify where an
asset is placed and must not replace a fixed-slot foreign key.

## Fixed-slot relationships

| Table               | Column                  | Entity relation    | Meaning                     |
| ------------------- | ----------------------- | ------------------ | --------------------------- |
| `services`          | `image_asset_id`        | `imageAsset`       | Service card/selector image |
| `service_variants`  | `image_asset_id`        | `imageAsset`       | Variant card image          |
| `service_variants`  | `banner_image_asset_id` | `bannerImageAsset` | Variant detail banner       |
| `service_variants`  | `model_image_asset_id`  | `modelImageAsset`  | Variant model/cutout image  |
| `posts`             | `cover_image_asset_id`  | `coverImageAsset`  | Post cover image            |
| `banners`           | `image_asset_id`        | `imageAsset`       | Desktop banner image        |
| `banners`           | `mobile_image_asset_id` | `mobileImageAsset` | Mobile banner image         |
| `clubs`             | `cover_image_asset_id`  | `coverImageAsset`  | Club cover image            |
| `facilities`        | `cover_image_asset_id`  | `coverImageAsset`  | Facility cover image        |
| `membership_levels` | `image_asset_id`        | `imageAsset`       | Membership-level artwork    |
| `site_settings`     | `media_asset_id`        | `mediaAsset`       | Typed media-valued setting  |

All columns are nullable and indexed. All foreign keys reference
`media_assets.id` with `ON DELETE SET NULL ON UPDATE CASCADE`. `SET NULL` keeps
the consuming record and its legacy URL fallback valid after an exceptional
hard delete. Normal media deletion remains a soft delete.

Create/update DTOs accept the matching nullable UUID properties. Omission
preserves a slot during update; explicit `null` clears it. Selected records must
exist, must not be soft-deleted, must have `type=image`, and must be active for
a new selection. Marking an already-assigned asset inactive does not remove the
relation or suppress its nested public summary. `usage` mismatch is advisory
only and cannot authorize or reject placement.

Relational usage and safe deletion are documented in
`docs/MEDIA_LIFECYCLE.md`. Usage reporting covers every fixed slot, ordered club
gallery row, typed media-valued setting, and locale-specific relational post
inline reference, including references from soft-deleted content records.

## Response contracts

Internal service, variant, and post responses include the matching asset ID and
a nullable compact summary:

```ts
{
  id: string;
  name: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  isActive: boolean;
}
```

Public service, variant, and post responses include a nullable render-ready
summary:

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

Legacy URL response properties remain present. During transition, consumers
should render the nested asset when present and fall back to the matching legacy
URL. These compatibility response properties are marked deprecated in Swagger
but are not scheduled for removal by this migration. Consumers must not call
`/media-assets/public` after loading an entity to infer its placement.

The service/service-variant legacy values can now be moved into managed storage
with the controlled importer documented in `docs/SERVICE_MEDIA_IMPORT.md`. It
imports actual bytes before assigning a relation; it never creates a managed
record that points back at a frontend-relative path. Post cover import remains
outside that command's scope.

## Post HTML

`posts.content_html_en` and `posts.content_html_vi` are nullable `text` columns
and serialize as `contentHtmlEn` / `contentHtmlVi`. The legacy
`contentUrlEn` / `contentUrlVi` properties remain unchanged for compatibility
and later import.

Stored HTML now passes through the centralized post-content sanitizer on every
create/update and legacy import. Detail serialization sanitizes again in
memory as defense in depth. The supported semantic subset, 512 KiB per-locale
limit, link/image rules, list/detail boundaries, and local-only legacy importer
are documented in `docs/POST_CONTENT.md`.

`contentUrlEn` and `contentUrlVi` remain deprecated migration fields. Public
requests never fetch them. They must not be removed until the CMS and public
frontend render database HTML and a later cleanup verifies that no consumer
depends on them.

## Ordered club gallery

`club_gallery_media_assets` contains `id`, `club_id`, `media_asset_id`, and
non-negative `display_order`. A club cannot use the same asset twice and cannot
assign two rows to the same order. Club deletion cascades to its gallery rows;
media hard deletion is restricted while a row exists. Responses sort by
`displayOrder`, then row ID.

Protected create/update requests use:

```ts
galleryMedia?: Array<{
  mediaAssetId: string;
  displayOrder: number;
}>;
```

Create omission produces an empty managed gallery. Update omission preserves
the existing managed gallery; `[]` clears it; any supplied array replaces it
atomically. Array order and `displayOrder` must both be `0..n-1`. The legacy
`clubs.gallery_image_urls` JSON URL array remains unchanged as a deprecated
fallback; no repository-relative path is claimed as imported.

## Typed media-asset site settings

`SiteSetting` is already a typed-value design, so a separate placement entity
would duplicate its stable key, grouping, public visibility, editability, and
ordering semantics. The new `media_asset` value type therefore uses nullable
`media_asset_id` plus `mediaAsset`. Its scalar `value` is normally null, but it
may retain a public legacy image URL during the transition. Consumers resolve
`mediaAsset.url` first and then `value`; the importer never clears the fallback.
Non-media types require a scalar value and must not carry a media relation.
Existing `image_url` settings remain intact until explicitly imported.

Prompt 9A did not create a database row for the formerly frontend-owned shared
club-tour/registration background. Prompt 9B reserves the public setting key
`registration.shared_background` in group `registration`; the CMS may create
that editable `media_asset` setting once and future image changes then require
no frontend source modification. The frontend must keep its bundled artwork as
the final fallback until that setting exists.
