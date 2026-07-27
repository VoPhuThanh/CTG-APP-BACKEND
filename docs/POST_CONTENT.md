# Post HTML content contract

## Storage and lifecycle

Posts store bilingual article fragments in PostgreSQL:

- `contentHtmlEn: text null`
- `contentHtmlVi: text null`

Migration `1784178000000-add-editorial-media-foundations.ts` created both
columns. This phase does not add another schema migration.

`contentUrlEn` and `contentUrlVi` remain nullable database columns and
deprecated API compatibility fields. They are temporary inputs for the legacy
import command only. Public post requests never fetch either URL. New CMS
create/update flows must send HTML directly and must not create new URL-backed
post bodies.

The per-locale input limit is 512 KiB measured as UTF-8 bytes. Inputs above the
limit return `413 POST.CONTENT_TOO_LARGE`.

Create and update semantics are:

| Request value | Create                                | Update                   |
| ------------- | ------------------------------------- | ------------------------ |
| omitted       | stores `null`                         | preserves existing value |
| `null`        | stores `null`                         | clears the locale        |
| string        | sanitizes, then stores HTML or `null` | sanitizes, then replaces |

An empty string or a string containing only removed content is normalized to
`null`.

## Sanitizer allowlist

`PostContentSanitizerService` is the single sanitizer used by post
create/update, legacy import, and detail serialization.

Supported elements:

```text
h2 h3 h4 h5 h6
p strong em b i u s del mark small sup sub
ul ol li dl dt dd
a
figure figcaption img
blockquote hr
table caption colgroup col thead tbody tfoot tr th td
code pre br
section
```

An incoming `h1` is normalized to `h2` because the public article page owns the
only article-level `h1`. Disallowed wrapper elements such as `html`, `body`,
`article`, `div`, and `span` are removed while safe child content is retained.
`head`, scripts, styles, templates, forms, controls, iframes, objects, embeds,
SVG, and MathML are removed with their unsafe content.

No `style`, `class`, `id`, event-handler, `srcset`, or arbitrary `data-*`
attribute is allowed.

Allowed attributes are:

- links: `href`, `title`; the backend owns `target` and `rel`;
- legacy/external images: `src`, `alt`, `title`, numeric `width`, numeric
  `height`; the backend adds `loading="lazy"` and `decoding="async"`;
- managed images: exactly `data-media-asset-id` and `alt` in canonical stored
  HTML;
- table cells: `colspan`, `rowspan`, and `scope` where appropriate;
- columns: `span`.

## Link and inline-image rules

Links may use:

- root-relative application paths such as `/news/example`;
- safe fragment links such as `#weekly-plan`;
- `http`, `https`, `mailto`, or `tel` absolute URLs.

Protocol-relative, credential-bearing web URLs, control-character-obfuscated
URLs, `javascript:`, and `data:` URLs are removed. Absolute HTTP(S) links are
rendered with:

```html
target="_blank" rel="noopener noreferrer"
```

Legacy inline images may use:

- a public HTTPS URL; or
- a stable root-relative public media URL such as
  `/uploads/media/posts/example.webp`.

Managed CMS-selected images use:

```html
<img
  data-media-asset-id="5e8e7b84-56cb-4db1-82ba-33f1a740a9e1"
  alt="Localized alternative text"
/>
```

`figure` and `figcaption` may wrap the marker. Submitted `src`, dimensions,
loading attributes, event handlers, and arbitrary `data-*` attributes are
removed from managed markers. Invalid UUIDs are rejected. Referenced assets
must be non-deleted images and must be active for a new locale reference.

## Write-time and output sanitization

Every API create/update string and every legacy-import source is sanitized
before storage. Detail responses are sanitized again in memory as defense in
depth; the second pass does not rewrite the database. List responses never
load or serialize the body columns.

The output pass protects consumers if legacy/manual database writes bypassed
the normal service. Sanitizer upgrades can therefore tighten detail output
immediately; operators should rerun the legacy import with an explicit
overwrite only when they intentionally want the stored copy rewritten.

## Cover media

Post create/update accepts:

```ts
coverImageAssetId?: string | null;
```

Create omission or `null` leaves the cover unassigned. Update omission
preserves the current cover; update `null` clears it. New selections use
`MediaAssetReferencesService` and must resolve to a non-deleted, active image.
`usage=general` and `usage=post` are compatible; other usage values produce an
advisory warning but remain assignable.

Internal responses expose `coverImageAssetId` and the internal compact asset
summary. Public responses expose the render-ready public summary. Deprecated
`coverImageUrl` remains as a temporary fallback.

## List and detail response boundaries

Protected `GET /posts` returns post list items. It retains deprecated
`contentUrlEn` / `contentUrlVi` for the current CMS transition but omits
`contentHtmlEn` / `contentHtmlVi`.

Protected `GET /posts/:id` returns canonical marker HTML, deprecated URL
fields, and a deduplicated `inlineMediaAssets` collection for editor preview.

Public `GET /posts/public` returns catalogue fields only. It omits both HTML
bodies and both legacy content URLs.

Public `GET /posts/public/:slug` resolves markers from the already-loaded
relation graph. `resolvedContentHtmlEn` / `resolvedContentHtmlVi` contain
current safe URLs, lazy loading, and known dimensions. Deprecated
`contentHtmlEn` / `contentHtmlVi` remain resolved aliases during the consumer
migration; public responses never expose canonical URL-less markers as if they
were render-ready.

Migration `1784523600000-add-post-inline-media-assets.ts` creates one unique
reference per `post_id + media_asset_id + locale`, with indexes and foreign
keys. It runs after
`1784437200000-add-minio-storage-portability.ts`.

Public status, publication-date, active-category, search, category filter,
featured filter, ordering, and pagination behavior are unchanged. Draft,
archived, future-published, soft-deleted, and inactive-category posts remain
unavailable through public routes.

## Legacy import

Use `npm run import:post-content`. The command is dry-run by default and
requires an explicit local source root:

```text
npm run import:post-content -- --source-root="D:\Personal Project\ctg-app-frontend\public" --report=post-content-dry-run.json
```

Apply after reviewing the report:

```text
npm run import:post-content -- --apply --source-root="D:\Personal Project\ctg-app-frontend\public" --report=post-content-apply.json
```

The source root is the directory below which the stored legacy URL resolves.
For example, `/content/posts/guide.en.html` plus a source root ending in
`public` resolves to `public/content/posts/guide.en.html`.

The reader rejects traversal, symlink escape, query/hash suffixes, non-HTML
paths, absolute filesystem paths, URL schemes, missing files, and sources above
512 KiB. Remote HTML is intentionally unsupported; the importer has no HTTP
client and creates no SSRF surface.

Existing nonempty `contentHtmlEn` or `contentHtmlVi` is never overwritten by
default. Intentional replacement requires both flags:

```text
npm run import:post-content -- --apply --overwrite-existing --source-root="D:\approved\public"
```

The report contains deterministic post/language entries under `imported`,
`planned`, `skipped`, `failed`, and `stillUnresolved`, with matching summary
counts. A successful rerun performs no database write. Apply exits nonzero only
when a locale without existing HTML remains unresolved.
