# Managed Media Upload: Reference-Safety and Adoption Handoff

> MinIO, bucket metadata, and configuration-derived managed URLs are now
> implemented. See `minio-inline-media-backend-to-cms.md` and
> `docs/MEDIA_STORAGE.md` for the current storage contract.

> Reference-safety follow-up is now implemented. See
> `docs/MEDIA_LIFECYCLE.md` and
> `docs/handoffs/media-reference-safety-backend-to-cms-and-modules.md` for the
> live validation, usage-report, and deletion contracts.

## Final backend contract

The backend now exposes one general managed-image upload route for every CMS
module:

```text
POST /media-assets/upload
Permission: media-assets:create
Content-Type: multipart/form-data
```

Required parts are `file` and `name`. Optional metadata is `altTextEn`,
`altTextVi`, `descriptionEn`, `descriptionVi`, `usage`, `isActive`, and
`displayOrder`. Supported binaries are validated JPEG, PNG, GIF, and WebP up to
`MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES`. SVG is not supported.

The response is the normal internal `MediaAssetResponseDto`. Important managed
properties are:

```ts
{
  id: string;
  url: string;
  storageProvider: string; // "local" initially
  storageKey: string;
  originalFilename: string;
  checksum: string; // SHA-256 hex
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  width: number;
  height: number;
  fileSizeBytes: number;
  altTextEn: string | null;
  altTextVi: string | null;
  metadata: MetadataResponseDto;
}
```

External transitional records created through `POST /media-assets` have
`storageProvider: null` and `storageKey: null`. Consumers must use this state,
not URL parsing, to distinguish them.

## CMS adoption sequence

For every fixed image slot:

1. upload once through `/media-assets/upload`;
2. retain the returned stable `id` as the selection value;
3. submit that ID through the consuming module's existing nullable asset-ID
   property;
4. render the nested asset summary returned with the consuming record;
5. during the compatibility window, fall back to the existing legacy URL only
   when the nested asset is null.

Current Prompt 1 fixed-slot properties are:

| Module/object   | Request property     | Response relation  |
| --------------- | -------------------- | ------------------ |
| Service         | `imageAssetId`       | `imageAsset`       |
| Service variant | `imageAssetId`       | `imageAsset`       |
| Service variant | `bannerImageAssetId` | `bannerImageAsset` |
| Service variant | `modelImageAssetId`  | `modelImageAsset`  |
| Post            | `coverImageAssetId`  | `coverImageAsset`  |

Omission and explicit null remain distinct on updates: omission preserves the
current relationship; null clears it. `MediaAssetUsage` is organizational and
must not be used to infer placement.

Do not add service-, post-, banner-, club-, facility-, membership-, or
site-setting-specific upload endpoints. They must all use the shared media
route.

## Reference safety

- Uploading does not attach an asset to any module. Assignment is a separate,
  explicit consuming-module update.
- Replacing an image means uploading a new asset and atomically updating the
  consuming slot to its new ID. Managed file metadata and URL are not patched
  in place.
- Normal media deletion first checks every registered fixed-slot reference. It
  is blocked with `MEDIA_ASSET.IN_USE` while references remain; otherwise it is
  soft-delete only. Do not assume a soft-deleted media row means the object is
  physically absent.
- A future purge job must use the conservative orphan-assessment boundary and
  recheck every fixed-slot and ordered-gallery reference before deleting
  storage. Provider deletion is already available to the backend but is
  currently used only for failed-upload compensation.
- Public consumers should render the nested summary supplied by their service
  or post response. They must not query `/media-assets/public` to reconstruct
  placement.

## Deferred module adoption

The Prompt 1 deferrals remain unchanged: banner desktop/mobile slots, club
cover and ordered gallery join records, facility cover, membership-level art,
and image-valued site settings. Club galleries still require an ordered join
entity and must not become a JSON array of media IDs.

See `docs/MEDIA_STORAGE.md` for configuration, security validation, local
serving behavior, cleanup guarantees, and the provider-extension boundary.
