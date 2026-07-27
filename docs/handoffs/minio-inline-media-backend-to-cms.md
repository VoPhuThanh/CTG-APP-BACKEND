# MinIO and post inline-media: backend-to-CMS handoff

## Migration and deployment order

Run these migrations after the existing media reference-safety migration:

```text
1784437200000-add-minio-storage-portability.ts
1784523600000-add-post-inline-media-assets.ts
```

Start MinIO and bucket bootstrap before NestJS:

```text
docker compose up -d database minio minio-init
```

For host-run NestJS use `MINIO_ENDPOINT=localhost`. If NestJS later runs inside
the Compose network, use `MINIO_ENDPOINT=minio`. Browsers always use
`MEDIA_PUBLIC_BASE_URL`, for example
`http://localhost:9000/ctg-media`; the CMS must never receive or construct
`http://minio:9000`.

## Media asset contract

`POST /media-assets/upload` is unchanged. The response still contains `id`,
`url`, storage metadata, image metadata, localized alt text, and audit
metadata. New internal storage metadata is:

```ts
{
  storageProvider: 'local' | 'minio' | string | null;
  bucket: string | null;
  storageKey: string | null;
}
```

For managed MinIO records, `bucket + storageKey` is identity and `url` is a
current rendering value derived from backend configuration. Do not persist the
returned URL in CMS domain state, compare records by URL, or derive an asset ID
from a URL. Changing the public media domain changes responses without changing
the media row.

External transitional records still have null provider/bucket/key and retain
their URL. Existing service, variant, and post compatibility URL fields remain.

## Canonical editor marker grammar

When the user selects an image from the shared media library, save exactly:

```html
<img
  data-media-asset-id="5e8e7b84-56cb-4db1-82ba-33f1a740a9e1"
  alt="Localized alternative text"
/>
```

Optional figure form:

```html
<figure>
  <img
    data-media-asset-id="5e8e7b84-56cb-4db1-82ba-33f1a740a9e1"
    alt="Localized alternative text"
  />
  <figcaption>Optional caption</figcaption>
</figure>
```

CMS requirements:

- Use the media asset UUID from the picker.
- Do not save `src`, CDN URLs, MinIO URLs, width, height, loading state,
  event handlers, editor-only classes, or arbitrary `data-*` attributes on a
  managed marker.
- Keep alt text localized in each locale's HTML.
- The same asset may be used in both locales.
- Repeating an asset in one locale is allowed and produces one relational usage
  row.
- Omitted `contentHtmlEn` / `contentHtmlVi` preserves that locale on update;
  `null` clears it and removes that locale's inline references.

The backend sanitizes and canonicalizes HTML, validates marker UUIDs, loads
marker assets in bulk, rejects missing/deleted/non-image assets, and rejects an
inactive asset when it is a new locale reference. An already-referenced asset
that later becomes inactive remains renderable.

Relevant structured errors:

```text
400 POST.INLINE_MEDIA_MARKER_INVALID
400 MEDIA_ASSET.NOT_IMAGE
400 MEDIA_ASSET.INACTIVE
404 MEDIA_ASSET.NOT_FOUND
409 MEDIA_ASSET.IN_USE
```

## Protected post detail response

`GET /posts/:id` returns canonical authoring HTML and a deduplicated preview
collection:

```json
{
  "contentHtmlEn": "<p>...</p><img data-media-asset-id=\"uuid-1\" alt=\"Training area\" />",
  "contentHtmlVi": "<p>...</p><img data-media-asset-id=\"uuid-1\" alt=\"Khu vuc tap luyen\" />",
  "inlineMediaAssets": [
    {
      "id": "uuid-1",
      "name": "Training area",
      "url": "http://localhost:9000/ctg-media/images/2026/07/object.webp",
      "altTextEn": "Training area",
      "altTextVi": "Khu vuc tap luyen",
      "width": 1600,
      "height": 900,
      "mimeType": "image/webp",
      "isActive": true
    }
  ]
}
```

Build a preview lookup by asset ID from `inlineMediaAssets`. Replace marker
presentation only in the editor/preview DOM. When serializing, return to the
canonical marker and do not save the preview URL.

Protected and public post list responses remain compact and do not load full
HTML or inline media.

## Public post rendering contract

`GET /posts/public/:slug` returns:

```ts
{
  resolvedContentHtmlEn: string | null;
  resolvedContentHtmlVi: string | null;
  /** deprecated resolved compatibility aliases */
  contentHtmlEn: string | null;
  contentHtmlVi: string | null;
}
```

Resolved HTML includes the current safe `src`, `loading="lazy"`,
`decoding="async"`, available width/height, the canonical marker ID, localized
alt text, and captions. The frontend should migrate to the explicitly named
`resolvedContentHtmlEn` / `resolvedContentHtmlVi` fields.

## Usage and deletion

`GET /media-assets/:id/usage` now includes inline post references with post ID,
title, locale, semantic slot `post.inline_content_image`, and field
`contentHtmlEn` or `contentHtmlVi`. Asset deletion is blocked while any cover,
service, variant, or inline-post reference remains. The CMS must treat the
delete-time `409 MEDIA_ASSET.IN_USE` response as authoritative.

## Operations

- `postgres_data` was not renamed or replaced.
- `minio_data` persists object data.
- Bucket initialization is idempotent.
- Never use `docker compose down -v` in routine setup.
- Keep production console access private and use HTTPS/reverse proxy or CDN for
  public objects.
- Back up PostgreSQL and MinIO together.
- The repository `uploads/` directory was empty when this phase was
  implemented; no local binaries were relabelled or claimed as migrated.

## Verification completed on 2026-07-16

- `npm run lint`: passed with one pre-existing
  `src/database/seeds/admin-seeds.ts` no-floating-promises warning.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Task-focused Jest run: 19 suites and 93 tests passed.
- Full Jest baseline: 32 suites and 143 tests passed; 20 existing placeholder
  controller/service suites still fail because their Nest testing modules do
  not provide required services or repositories. No task-focused suite failed.
- `docker compose config --quiet`: passed.
- `git diff --check`: passed.
- Both new migrations were applied, reverted, and applied again against a
  disposable PostgreSQL container. The existing PostgreSQL volume was not
  changed by that migration test.
- MinIO was started through Compose, reported healthy, and `minio-init` exited
  successfully. Upload/read/delete was verified through both `mc` and the
  actual `MinioStorageProvider`.
- `npm install` reported four dependency-audit findings (two moderate and two
  high). No broad audit fix or unrelated dependency upgrade was performed.
