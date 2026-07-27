# Remaining editorial media schemas: backend-to-CMS handoff

## Status

Backend schema and API implementation is complete. Migration
`1784610000000-add-remaining-editorial-media-schemas.ts` is the deployment
boundary for this contract and has been executed against the verified local
development database. Its verification commands are recorded at the end of
this handoff.

No frontend or CMS code is changed by this backend phase.

## Complete field inventory

| Domain           | Legacy field                                | Classification                   | Managed contract                                       |
| ---------------- | ------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Service          | `imageUrl`                                  | Fixed CMS slot, already adopted  | `imageAssetId` / `imageAsset`                          |
| Service variant  | `imageUrl`                                  | Fixed CMS slot, already adopted  | `imageAssetId` / `imageAsset`                          |
| Service variant  | `bannerImageUrl`                            | Fixed CMS slot, already adopted  | `bannerImageAssetId` / `bannerImageAsset`              |
| Service variant  | `modelImageUrl`                             | Fixed CMS slot, already adopted  | `modelImageAssetId` / `modelImageAsset`                |
| Post             | `coverImageUrl`                             | Fixed CMS slot, already adopted  | `coverImageAssetId` / `coverImageAsset`                |
| Post             | images in `contentHtmlEn` / `contentHtmlVi` | Post-body media, already adopted | marker plus `post_inline_media_assets`                 |
| Banner           | `imageUrl`                                  | Fixed desktop slot               | `imageAssetId` / `imageAsset`                          |
| Banner           | `mobileImageUrl`                            | Fixed mobile slot                | `mobileImageAssetId` / `mobileImageAsset`              |
| Club             | `coverImageUrl`                             | Fixed cover slot                 | `coverImageAssetId` / `coverImageAsset`                |
| Club             | `galleryImageUrls`                          | Ordered gallery                  | `galleryMedia` backed by `club_gallery_media_assets`   |
| Facility         | `coverImageUrl`                             | Fixed cover slot                 | `coverImageAssetId` / `coverImageAsset`                |
| Membership level | `imageUrl`                                  | Fixed artwork slot               | `imageAssetId` / `imageAsset`                          |
| Site setting     | `value` with `valueType=image_url`          | Legacy typed image URL           | Retained; new asset values use `valueType=media_asset` |

Frontend-owned icons, logos, page-banner fallbacks, the club-tour registration
background, textures, illustrations, and other build-time design assets are
not backend editorial media. The CMS adoption report explicitly classifies the
club-tour/registration background as frontend-owned, so no setting key is
invented for it.

## Database contract

The migration adds these nullable indexed foreign keys to `media_assets.id`:

- `banners.image_asset_id`;
- `banners.mobile_image_asset_id`;
- `clubs.cover_image_asset_id`;
- `facilities.cover_image_asset_id`;
- `membership_levels.image_asset_id`;
- `site_settings.media_asset_id`.

Each uses `ON DELETE SET NULL ON UPDATE CASCADE`. The migration also makes the
legacy required `banners.image_url` column nullable so a new banner can use a
managed desktop image without fabricating a compatibility URL. All other
legacy URL columns and `clubs.gallery_image_urls` remain unchanged.

`club_gallery_media_assets` contains:

```text
id uuid primary key
club_id uuid not null
media_asset_id uuid not null
display_order integer not null check >= 0
```

Constraints and deletion behavior:

- unique `(club_id, media_asset_id)`; duplicate use within one club is not a
  product requirement;
- unique `(club_id, display_order)`;
- indexed `club_id`, `media_asset_id`, and `display_order`;
- club foreign key: `ON DELETE CASCADE ON UPDATE CASCADE`;
- media foreign key: `ON DELETE RESTRICT ON UPDATE CASCADE`.

## Fixed-slot request properties

All properties below are optional nullable UUIDs on create and update DTOs:

| Request DTOs                                           | Property                     |
| ------------------------------------------------------ | ---------------------------- | ----- |
| `BannerCreateDto`, `BannerUpdateDto`                   | `imageAssetId?: string       | null` |
| `BannerCreateDto`, `BannerUpdateDto`                   | `mobileImageAssetId?: string | null` |
| `ClubCreateDto`, `ClubUpdateDto`                       | `coverImageAssetId?: string  | null` |
| `FacilityCreateDto`, `FacilityUpdateDto`               | `coverImageAssetId?: string  | null` |
| `MembershipLevelCreateDto`, `MembershipLevelUpdateDto` | `imageAssetId?: string       | null` |

Update semantics are exact:

| Payload state      | Meaning                            |
| ------------------ | ---------------------------------- |
| Property omitted   | Preserve the current relation.     |
| Property is `null` | Clear the current relation.        |
| Property is a UUID | Validate and replace the relation. |

New selections must resolve to a non-deleted, active image through
`MediaAssetReferencesService`. Missing assets return
`404 MEDIA_ASSET.NOT_FOUND`; non-images return `400 MEDIA_ASSET.NOT_IMAGE`;
inactive assets return `400 MEDIA_ASSET.INACTIVE`. Usage mismatch remains an
advisory warning and does not block assignment.

## Fixed-slot response properties

Protected responses include the matching nullable ID and compact summary:

```ts
type MediaAssetSummary = {
  id: string;
  name: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  isActive: boolean;
};
```

Public responses include the nested render-ready summary without internal name
or active state:

```ts
type PublicMediaAssetSummary = {
  id: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};
```

Exact response pairs are:

- banner: `imageAssetId` / `imageAsset` and `mobileImageAssetId` /
  `mobileImageAsset` internally; public response exposes both summaries;
- club: `coverImageAssetId` / `coverImageAsset` internally and
  `coverImageAsset` publicly;
- facility: `coverImageAssetId` / `coverImageAsset` internally and
  `coverImageAsset` publicly;
- membership level: `imageAssetId` / `imageAsset` internally and `imageAsset`
  publicly.

Every legacy URL property remains present and deprecated. Render each slot as
`nestedAsset?.url ?? legacyUrl`.

## Club gallery write contract

Protected club create/update requests accept:

```ts
galleryMedia?: Array<{
  mediaAssetId: string;
  displayOrder: number;
}>;
```

Rules:

- asset IDs must be unique;
- display orders must be unique, non-negative, and exactly `0..n-1` in array
  order;
- create omission creates no managed gallery rows;
- update omission preserves all managed gallery rows;
- update `galleryMedia: []` clears all managed gallery rows;
- any nonempty update array is atomic replacement state;
- every asset passes the same active-image validation as fixed slots;
- invalid ordering returns `400 CLUB.GALLERY_ORDER_INVALID`.

Protected club responses return:

```ts
galleryMedia: Array<{
  id: string;
  mediaAssetId: string;
  displayOrder: number;
  mediaAsset: MediaAssetSummary;
}>;
```

Public club detail returns:

```ts
galleryMedia: Array<{
  id: string;
  displayOrder: number;
  mediaAsset: PublicMediaAssetSummary;
}>;
```

Rows are ordered by `displayOrder`, then row `id`. Public club list and featured
list responses deliberately do not expose or load `galleryMedia`. They still
carry the existing `galleryImageUrls` compatibility array because it is a
column on the club record, not a relation load.

## Site-setting decision and contract

`SiteSetting` already owns stable keys, typed values, grouping, public
visibility, editability, and display ordering. A separate placement entity
would duplicate those semantics, so the backend adds
`SiteSettingValueType.MEDIA_ASSET = 'media_asset'` and the nullable
`mediaAssetId` / `mediaAsset` relation.

Create/update properties are:

```ts
value?: string | null;
valueType?: SiteSettingValueType;
mediaAssetId?: string | null;
```

For `valueType=media_asset`, `value` must be omitted or null and `mediaAssetId`
selects or clears the image. Protected and public responses return:

```ts
{
  value: null;
  valueType: 'media_asset';
  mediaAssetId: string | null;
  mediaAsset: MediaAssetSummary | PublicMediaAssetSummary | null;
}
```

For every scalar value type, `value` is required, `mediaAssetId` must be
omitted or null, and responses return `mediaAssetId: null` and
`mediaAsset: null`. Existing `image_url` rows are not rewritten.

## Media usage and deletion protection

`GET /media-assets/:id/usage` now registers these additional stable slots:

```text
banner.image
banner.mobile_image
club.cover_image
club.gallery_image
facility.cover_image
membership_level.image
site_setting.media_asset
```

Normal media deletion remains blocked with `409 MEDIA_ASSET.IN_USE` while any
of these references exists. Gallery usage reports the owning club and field
`galleryMedia`.

## Routes

No route names or permissions changed. The existing protected banner, club,
facility, membership-level, and site-setting CRUD routes accept the new
properties. Existing public banner, club, facility, membership, and
site-setting routes return the new summaries as described above.

## Migration and verification status

Migration class:
`AddRemainingEditorialMediaSchemas1784610000000`.

Local development database execution status: executed on 2026-07-17.

Database gate and migration results:

- `.env` targets `project_db` on localhost port 5433;
- Compose confirmed running local container `ctg_app_database`, mapping
  `5433:5432`;
- read-only identity query confirmed database `project_db`, user `admin`, and
  the container PostgreSQL data directory;
- initial `npm run migration:show` reported only
  `AddRemainingEditorialMediaSchemas1784610000000` pending;
- all earlier media migrations through
  `AddPostInlineMediaAssets1784523600000` were already applied;
- `npm run migration:run` committed the new migration successfully;
- final `npm run migration:show` marked migration 14 executed with no pending
  migration.

Code verification:

- targeted Prettier: passed;
- `npm run lint`: passed with one pre-existing
  `src/database/seeds/admin-seeds.ts` no-floating-promises warning;
- `npm run typecheck`: passed;
- focused Jest: 5 suites and 15 tests passed;
- `npm run build`: passed.

Endpoint smoke tests used the existing application already listening on
localhost:3000 after migration. Each returned HTTP 200:

- `GET /banners/public/hero-carousel` returned `imageAsset` and
  `mobileImageAsset`;
- `GET /clubs/public` returned `coverImageAsset` and did not expose
  `galleryMedia`;
- `GET /clubs/public/:slug` exposed `galleryMedia` on detail;
- `GET /facilities/public` returned `coverImageAsset`;
- `GET /memberships/public/levels` returned `imageAsset`;
- `GET /site-settings/public` returned `value`, `valueType`, `mediaAssetId`, and
  `mediaAsset` as distinct fields.

The live records currently have no managed club gallery assignments, so detail
smoke validation confirmed an empty ordered array rather than a populated
order example. Ordering, uniqueness, clear/replace behavior, and migration
up/down ordering are covered by focused tests and database constraints.

## CMS adoption work

The CMS can now add media pickers for all fixed slots and an ordered club
gallery editor. Preserve omission versus null exactly. Do not submit legacy URL
fields for new managed selections, do not infer placement from media usage,
and do not add a CMS field for frontend-owned club-tour/registration artwork.

For the gallery, visual array order must serialize to consecutive
`displayOrder` values, with drag and accessible move-button controls. The CMS
must use public/detail nested summaries directly and must not query the public
media list to reconstruct relations.
