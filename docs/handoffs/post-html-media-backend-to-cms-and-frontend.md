# Post HTML and cover media: CMS/frontend handoff

> Superseded for inline images by
> `minio-inline-media-backend-to-cms.md`. Canonical
> `data-media-asset-id` markers and relational inline usage are now supported.

## Final backend contract

The backend now owns sanitized bilingual post HTML. New clients must stop
creating URL-backed article bodies.

Create example:

```json
{
  "titleEn": "A practical weekly training guide",
  "titleVi": "Huong dan lich tap hang tuan",
  "slug": "practical-weekly-training-guide",
  "categoryId": "11111111-1111-4111-8111-111111111111",
  "shortDescriptionEn": "Build a balanced routine you can sustain.",
  "shortDescriptionVi": "Xay dung lich tap can bang va de duy tri.",
  "contentHtmlEn": "<h2>Plan the week</h2><p>Start with a sustainable schedule.</p>",
  "contentHtmlVi": "<h2>Len ke hoach trong tuan</h2><p>Bat dau voi lich tap phu hop.</p>",
  "coverImageAssetId": "22222222-2222-4222-8222-222222222222",
  "publishedAt": "2026-07-16T00:00:00.000Z",
  "status": "published",
  "isFeatured": false,
  "displayOrder": 0
}
```

Update omission preserves content and cover:

```json
{
  "titleEn": "Updated title"
}
```

Explicit clearing is distinct:

```json
{
  "contentHtmlVi": null,
  "coverImageAssetId": null
}
```

Do not serialize untouched fields as `null`. Omitted
`contentHtmlEn` / `contentHtmlVi` / `coverImageAssetId` preserve existing
values; explicit `null` clears them.

The server sanitizes every HTML string. The CMS may sanitize or preview for
user experience, but client sanitization is not a security boundary.

## CMS phase

The post editor should:

- replace content URL inputs with bilingual rich-HTML inputs bound to
  `contentHtmlEn` and `contentHtmlVi`;
- enforce or display the documented 512 KiB UTF-8 limit per locale;
- configure the editor to produce the supported subset in
  `docs/POST_CONTENT.md`;
- begin headings at `h2`; the backend converts accidental `h1` to `h2`;
- use the shared media library/upload flow for `coverImageAssetId`;
- display `coverImageAsset` first and deprecated `coverImageUrl` only as a
  fallback;
- preserve omission versus explicit `null` on update;
- stop sending `contentUrlEn`, `contentUrlVi`, and `coverImageUrl` for new
  records.

Inline editor images may initially use public HTTPS URLs or stable
root-relative public media URLs. Do not emit base64/data URLs,
`data-media-asset-id`, inline styles, iframe/embed content, or arbitrary
classes. Inline media references are not tracked by media usage reporting in
this phase.

Protected list item example:

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "titleEn": "A practical weekly training guide",
  "titleVi": "Huong dan lich tap hang tuan",
  "slug": "practical-weekly-training-guide",
  "category": {
    "id": "11111111-1111-4111-8111-111111111111",
    "nameEn": "Guides",
    "nameVi": "Huong dan",
    "slug": "guides",
    "isActive": true
  },
  "shortDescriptionEn": "Build a balanced routine you can sustain.",
  "shortDescriptionVi": "Xay dung lich tap can bang va de duy tri.",
  "contentUrlEn": null,
  "contentUrlVi": null,
  "coverImageUrl": null,
  "coverImageAssetId": "22222222-2222-4222-8222-222222222222",
  "coverImageAsset": {
    "id": "22222222-2222-4222-8222-222222222222",
    "name": "Weekly training cover",
    "url": "/uploads/media/posts/weekly-training.webp",
    "altTextEn": "Athlete following a weekly plan",
    "altTextVi": "Nguoi tap theo lich hang tuan",
    "width": 1200,
    "height": 630,
    "mimeType": "image/webp",
    "isActive": true
  },
  "publishedAt": "2026-07-16T00:00:00.000Z",
  "status": "published",
  "isFeatured": false,
  "displayOrder": 0,
  "metadata": {
    "createdAt": "2026-07-16T00:00:00.000Z",
    "createdBy": null,
    "updatedAt": "2026-07-16T00:00:00.000Z",
    "updatedBy": null,
    "deletedBy": null
  }
}
```

`GET /posts/:id` adds:

```json
{
  "contentHtmlEn": "<h2>Plan the week</h2><p>Start with a sustainable schedule.</p>",
  "contentHtmlVi": "<h2>Len ke hoach trong tuan</h2><p>Bat dau voi lich tap phu hop.</p>"
}
```

The protected list deliberately omits both HTML fields. The CMS must fetch
detail before populating the editor.

## Public frontend phase

`GET /posts/public` no longer returns `contentUrlEn`, `contentUrlVi`,
`contentHtmlEn`, or `contentHtmlVi`.

Public list item example:

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "titleEn": "A practical weekly training guide",
  "titleVi": "Huong dan lich tap hang tuan",
  "slug": "practical-weekly-training-guide",
  "category": {
    "id": "11111111-1111-4111-8111-111111111111",
    "nameEn": "Guides",
    "nameVi": "Huong dan",
    "slug": "guides",
    "isActive": true
  },
  "shortDescriptionEn": "Build a balanced routine you can sustain.",
  "shortDescriptionVi": "Xay dung lich tap can bang va de duy tri.",
  "coverImageUrl": null,
  "coverImageAsset": {
    "id": "22222222-2222-4222-8222-222222222222",
    "url": "/uploads/media/posts/weekly-training.webp",
    "altTextEn": "Athlete following a weekly plan",
    "altTextVi": "Nguoi tap theo lich hang tuan",
    "width": 1200,
    "height": 630,
    "mimeType": "image/webp"
  },
  "publishedAt": "2026-07-16T00:00:00.000Z",
  "isFeatured": false
}
```

`GET /posts/public/:slug` adds:

```json
{
  "contentUrlEn": "/content/posts/legacy-guide.en.html",
  "contentUrlVi": "/content/posts/legacy-guide.vi.html",
  "contentHtmlEn": "<h2>Plan the week</h2><p>Start with a sustainable schedule.</p>",
  "contentHtmlVi": "<h2>Len ke hoach trong tuan</h2><p>Bat dau voi lich tap phu hop.</p>"
}
```

The two URL fields remain deprecated only for the migration window. The
frontend must render `contentHtmlEn` / `contentHtmlVi` and must not fetch the
legacy URL. Select the requested locale first, then the other nonempty HTML
locale as an explicit fallback. Keep the existing fallback notice behavior.

The backend returns already-sanitized fragments, but the frontend must still
render them only in the scoped article container and retain its content
security headers. The page owns the only `h1`.

## Legacy migration

Before removing frontend fragment files, run the backend importer documented in
`docs/POST_CONTENT.md`. Verify every live post locale has nonempty database HTML
and review the report. Do not remove legacy database columns or response fields
until both consumers have deployed and the cleanup phase verifies that no
client still reads them.
