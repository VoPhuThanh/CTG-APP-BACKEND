# Backend Context for Codex

## Implemented domains

- auth
- users
- roles
- permissions
- clubs
- facilities
- services and service variants
- banners
- customer leads
- memberships
- posts and post categories
- media assets
- site settings

## Shared architecture

Important cross-cutting areas include:

- permission decorators and guards,
- authenticated-user decorators,
- metadata DTOs and mappers,
- pagination query/response utilities,
- sorting constants,
- structured application errors,
- slug utilities.

## Public-content conventions

Public content commonly uses bilingual fields:

- `nameEn` / `nameVi`
- `titleEn` / `titleVi`
- `descriptionEn` / `descriptionVi`
- localized link fields where required

Lifecycle content generally uses status enums such as draft, published, and archived. Simple availability records may use `isActive`.

## Banner placements

The canonical banner placements are `homepage_carousel`, `club`, `service`,
`membership`, and `news`. New create/update requests and the protected list
filter accept only these values. `GET /banners/public?placement=<placement>`
returns the published, started, non-expired banners for any canonical placement
in deterministic `displayOrder`, `publishedAt`, then `id` order. The existing
`GET /banners/public/hero-carousel` route remains an alias for
`homepage_carousel`. An absent placement has the clear response `[]`.

Migration `1784696400000-refactor-banner-placements.ts` maps `pricing_page` to
`membership`. It preserves `homepage_section` and `contact_page` rows without
reclassification by archiving them, moving their original value to
`legacy_placement`, preserving their former status in `legacy_status`, and
setting canonical `placement` to null. These legacy values are read-only: they
are not accepted for new writes or returned by public placement queries. A CMS
may convert such a record by explicitly selecting a canonical placement.

Public banner media follows the managed-media contract: `imageAsset` and
`mobileImageAsset` contain render-ready `id`, resolved `url`, localized alt
text, dimensions, and MIME type. Deprecated `imageUrl` and `mobileImageUrl`
remain nullable fallbacks. Load the nested managed asset first; the public
query joins both relations and does not issue per-banner asset queries.

Inspect with `npm run migration:show` and apply to the configured development
database with `npm run migration:run`. The migration is transactional. Its
down path refuses to discard new `club`, `service`, or `news` records.

## Consumer awareness

The CMS consumes protected management routes.

The public frontend consumes public routes and must only receive published/public-safe data.

When a backend change affects a consumer:

1. define the final contract,
2. update the backend,
3. update CMS,
4. update public frontend,
5. validate each repository separately.

## Editorial media transition

Migration `1784178000000-add-editorial-media-foundations.ts` establishes the
additive foundation for CMS-managed editorial images and database-stored post
HTML.

`MediaAsset` remains the shared uploaded-file record. Its `usage` value is
organizational metadata only; placement is represented by explicit nullable
foreign keys. Managed records can now store a provider-independent
`storageKey`, `originalFilename`, and `checksum`. `storageKey` remains nullable
only so legacy externally hosted records can coexist during import. Binary
content is not stored in PostgreSQL.

The first fixed-slot adoption batch adds these relationships while retaining
every legacy URL field:

- `services.image_asset_id` for the service card/selector image;
- `service_variants.image_asset_id` for the variant card image;
- `service_variants.banner_image_asset_id` for the detail banner;
- `service_variants.model_image_asset_id` for the model/cutout image;
- `posts.cover_image_asset_id` for the post cover.

Internal responses expose the selected asset ID and a compact asset summary.
Public responses expose render-ready summaries containing `id`, `url`, both
localized alt-text values, dimensions, and MIME type. Consuming modules load
these relations with their entity and must not query the public media endpoint
to reconstruct a slot.

Service and service-variant adoption is complete at the API layer. Create and
update requests accept `imageAssetId`, plus `bannerImageAssetId` and
`modelImageAssetId` for variants. Update omission preserves the current slot;
explicit `null` clears it. Every legacy URL request/response property is marked
deprecated and remains a fallback only. Resolve each slot with the nested asset
URL first, for example `imageAsset?.url ?? imageUrl`.

Existing service URLs can be imported with the one-time
`npm run import:service-media` command. It is dry-run by default and requires
`--apply` to write. Frontend-relative paths require an explicit
`--source-dir`; remote sources are downloaded with size/type/timeout/redirect
limits and pinned public-address SSRF checks. The importer deduplicates by
provider plus SHA-256 and uses deterministic
`imports/services/<checksum>.<extension>` storage keys. See
`docs/SERVICE_MEDIA_IMPORT.md` and the service-media consumer handoff.

Posts also expose nullable `contentHtmlEn` and `contentHtmlVi`. The existing
`contentUrlEn`, `contentUrlVi`, and image URL fields remain compatibility/import
fields and must not be removed until a later verified migration.

Post HTML adoption is now complete at the backend API layer.
`PostContentSanitizerService` enforces a semantic article allowlist, a 512 KiB
UTF-8 limit per locale, safe link/image URL rules, `h1` to `h2` normalization,
and write-time plus detail-output sanitization. Post body columns use
`select=false`; protected and public list queries do not hydrate or serialize
them. Public list responses also omit the deprecated content URLs, while public
detail retains the URLs only for the consumer migration window and never
fetches them.

`npm run import:post-content` is the dry-run-by-default, local-root-only legacy
fragment importer. It rejects remote URLs and path/symlink escape, sanitizes
before storage, reports per-post/per-language outcomes, and never overwrites
nonempty database HTML without `--apply --overwrite-existing`. See
`docs/POST_CONTENT.md` and the post HTML/media consumer handoff.

Migration `1784610000000-add-remaining-editorial-media-schemas.ts` completes
the remaining backend relationship foundation while retaining every legacy
URL field. It adds banner desktop/mobile assets, club cover media, facility
cover media, membership-level media, typed media-asset site settings, and the
explicit `club_gallery_media_assets` ordered join table.

Fixed-slot writes use nullable UUID properties. Update omission preserves a
relation and explicit `null` clears it. Club gallery writes use
`galleryMedia: [{ mediaAssetId, displayOrder }]`; when present the array is full
replacement state, `[]` clears it, asset IDs and orders must be unique, and
orders must be consecutive from zero. Public club lists do not load or expose
managed gallery rows, while public club detail returns them in deterministic
order.

`SiteSetting` remains the typed setting model. `valueType=media_asset` stores a
nullable `mediaAssetId` relation. Its scalar `value` is normally null but may
retain a public legacy image URL for asset-first, URL-second transition
fallback. Scalar types do not carry managed relations. Existing
`valueType=image_url` settings remain legacy-compatible until imported.

Prompt 9B reserves `registration.shared_background` (group `registration`) as
the public setting key for the shared club-tour/registration artwork. No row is
silently seeded; the CMS can create the editable media setting when it adopts
the placement, after which image changes do not require frontend source edits.
See `docs/EDITORIAL_MEDIA.md` and the Prompt 9B CMS/frontend handoffs.

## Remaining editorial media runtime and import

Prompt 9B completes runtime adoption for banner desktop/mobile images, club
covers and ordered galleries, facility covers, membership-level images, and
typed site-media settings. All new assignments use
`MediaAssetReferencesService`; gallery validation resolves all selected assets
in one query and replacement remains in the club transaction. Existing
inactive assignments continue to render because relation loads do not filter
on `isActive`.

`npm run import:editorial-media` is dry-run by default and imports the remaining
legacy fields only with `--apply`. Frontend-relative paths require an explicit
`--source-dir`. Remote reads retain DNS-pinned SSRF checks, standard-port rules,
timeouts, redirect limits, content length/stream limits, and byte-level image
inspection. The importer uses the shared media storage service, preserves all
legacy URLs and gallery order, never overwrites managed assignments, and emits
imported/planned/skipped/failed/unresolved sections. See
`docs/EDITORIAL_MEDIA_IMPORT.md`.

The repository has no service-content seed. Existing seeds create only the
administrative user and permissions, so no URL-only service fixture is silently
introduced during this transition.

## Public services package

`GET /services/public` returns every published service in the existing service
order (`displayOrder` ascending, then `createdAt` descending, then `id`
ascending). Each service includes an unpaginated `variants` array containing
all published, non-deleted variants for that service. Services with no eligible
variants remain in the response with `variants: []`.

Nested variants are ordered by `displayOrder`, then `nameEn`, then `id`, all
ascending. Duplicate variant IDs are removed during response mapping. Each
variant retains the established public fields and now includes the card,
banner, and model managed-media summaries and deprecated URL fallbacks, plus
published club summaries ordered by club `displayOrder`, `nameEn`, and `id`.
Variant status remains intentionally absent from the public DTO.

The endpoint loads the complete package in one relation query; consumers can
select a service and filter its nested variants without a second variants
request or load-more flow. The standalone public variant list and detail routes
remain available and retain their existing contracts. This response-only
change requires no database migration or special deployment step.

## Managed image uploads

Migration `1784264400000-add-media-storage-provider.ts` and the shared storage
module turn the Prompt 1 metadata foundation into a managed-image system.
`POST /media-assets/upload` is the only CMS upload path and requires
`media-assets:create`. It validates JPEG, PNG, GIF, and WebP content, applies a
configurable size/type allowlist, preserves original raster bytes, generates
server-owned keys, calculates SHA-256, and maps detected MIME/dimensions into
the standard media response.

Managed records have paired non-null `storageProvider` / `storageKey` values;
external transitional records have both null. Existing Prompt 1 keys are
labelled `legacy` by the migration. Manual media creation remains URL-only and
cannot create managed state.

Storage access is behind `StorageProvider`. Both `local` and `minio` are
implemented. MinIO connection settings are private backend settings, while
`MEDIA_PUBLIC_BASE_URL` is the browser-facing base. Managed records use
provider, bucket, and storage key as identity; response URLs are resolved from
the current configuration and are not stored as localhost identity. A database
failure after storage write triggers object deletion; normal soft-delete
retains the binary until a future reference-aware purge workflow exists. See
`docs/MEDIA_STORAGE.md` and the MinIO/inline-media CMS handoff.

## Media reference safety

`MediaAssetReferencesService` is the reusable assignment and reference
boundary for image slots. New selections must resolve to a non-deleted, active
image. `usage` only produces an advisory compatibility warning and remains a
CMS filter; it never grants ownership or placement authorization. Consuming
modules must import `MediaAssetsModule` and use this service rather than
reimplementing asset lookup rules.

Inactive assets remain loaded through existing entity relations so a published
service, variant, or post does not break after an assigned asset is deactivated.
Only a new selection is rejected.

`GET /media-assets/:id/usage` requires `media-assets:read` and reports the five
fixed slots plus locale-specific post inline-content references. Normal media
deletion requires `media-assets:delete`, returns `MEDIA_ASSET.IN_USE` with the
usage report when references remain, and otherwise soft-deletes only the row.
The physical object is retained.

`MediaAssetOrphanCleanupService` is the future-job boundary. It only assesses
whether an asset is managed, soft-deleted before a caller-supplied retention
cutoff, and still unreferenced. No HTTP purge endpoint or physical-deletion job
exists yet.

Canonical post HTML now stores managed images as
`<img data-media-asset-id="<uuid>" alt="...">`. The explicit
`post_inline_media_assets` join table tracks one row per post, asset, and
locale. Internal detail returns canonical HTML plus a deduplicated
`inlineMediaAssets` collection. Public detail resolves markers in one loaded
relation graph and exposes `resolvedContentHtmlEn` /
`resolvedContentHtmlVi`; deprecated `contentHtmlEn` / `contentHtmlVi` remain
resolved compatibility aliases. See `docs/POST_CONTENT.md`,
`docs/MEDIA_LIFECYCLE.md`, and the MinIO/inline-media CMS handoff.
