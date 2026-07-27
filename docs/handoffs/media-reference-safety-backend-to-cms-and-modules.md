# Media Reference Safety: CMS and Module Handoff

> Inline post references are now implemented. See
> `minio-inline-media-backend-to-cms.md` for the additional locale-aware usage
> and deletion contract.

## CMS work

- Use `GET /media-assets/:id/usage` with `media-assets:read` before presenting
  destructive confirmation.
- Disable or relabel delete when `canDelete` is false and show every returned
  reference using `entityName`, `entityType`, and `slot`.
- Handle `409 MEDIA_ASSET.IN_USE` as authoritative because usage may change
  between the preview and delete requests. The error contains the refreshed
  report in `details` and a `usageUrl`.
- Treat `400 MEDIA_ASSET.INACTIVE` as a rejected new selection. Existing forms
  should preserve omitted asset fields when unchanged so already-assigned
  inactive images are not resubmitted as new selections.
- Use `usage` as a library filter or compatibility hint only. Do not hide all
  cross-usage assets or treat usage as placement permission.
- After successful deletion, remove the row from active media lists. Do not
  assume its physical URL/object disappeared immediately.

The exact usage and deletion payloads are defined in
`docs/MEDIA_LIFECYCLE.md` and in Swagger on the media endpoints.

## Backend consuming-module work

Import `MediaAssetsModule`, inject `MediaAssetReferencesService`, and call:

```ts
const { asset, warnings } =
  await mediaAssetReferencesService.validateImageSelection(assetId, {
    manager,
    slot: MediaAssetReferenceSlot.POST_COVER_IMAGE,
    compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.POST],
  });
```

Persist `asset` as the relation. Warnings are advisory; the validator has
already enforced existence, non-deleted state, image type, and active state.
Add every new relational slot to `MediaAssetReferencesService` usage reporting
and its tests in the same change.

Do not add module-specific upload endpoints, query media directly from
controllers, null image fields during asset deletion, or physically delete the
object in the request.

## Deferred scope

Inline images inside post HTML are not represented by relational slots and are
not included in usage totals. The CMS must not claim exact inline-image usage
tracking until the later HTML-content adoption phase supplies that contract.
