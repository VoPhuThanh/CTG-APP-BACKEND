# Remaining editorial media runtime: backend-to-frontend handoff

## Rendering rule

For every adopted fixed slot, render the managed summary URL first and retain
the legacy field as the transition fallback:

| Public response  | Render source                                                            |
| ---------------- | ------------------------------------------------------------------------ |
| banner desktop   | `imageAsset?.url ?? imageUrl`                                            |
| banner mobile    | `mobileImageAsset?.url ?? mobileImageUrl ?? imageAsset?.url ?? imageUrl` |
| club cover       | `coverImageAsset?.url ?? coverImageUrl`                                  |
| facility cover   | `coverImageAsset?.url ?? coverImageUrl`                                  |
| membership level | `imageAsset?.url ?? imageUrl`                                            |

Use the nested summary directly. Do not fetch `/media-assets/public` to rebuild
a placement. Summary URLs are already browser-facing and must never be replaced
with storage provider, bucket, storage key, internal MinIO, or filesystem data.

## Endpoints

- `GET /banners/public/hero-carousel` returns both independent banner assets.
- `GET /clubs/public` and `GET /clubs/public/featured` return cover media only;
  they intentionally do not load or expose managed gallery rows.
- `GET /clubs/public/:slug` returns ordered `galleryMedia`.
- `GET /facilities/public` and `GET /facilities/public/:slug` return cover media.
- `GET /memberships/public/levels`, `/levels/featured`, and `/levels/:slug`
  return membership artwork.
- `GET /site-settings/public?group=registration` returns public registration
  placements.

For public club detail, render managed gallery items in response order. During
transition, use `galleryMedia` when nonempty and otherwise use
`galleryImageUrls`; do not concatenate them or duplicates will appear.

## Shared registration background

Look up the exact key `registration.shared_background`. Resolve it as:

```text
setting.mediaAsset?.url ?? setting.value ?? bundledCurrentBackground
```

Keep the current bundled background only as the final absence/failure fallback.
Once the setting exists, changing its `mediaAssetId` through the CMS changes the
public background without a frontend source edit or deployment.

## URL portability

Managed URLs are resolved at response time from `MEDIA_PUBLIC_BASE_URL`; the
database stores provider-independent object identity. Do not cache the old base
as permanent content identity or write the resolved URL back into a legacy
field. A backend configuration change must be reflected by the next API fetch.
