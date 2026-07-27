# Remaining editorial media runtime: backend-to-CMS handoff

## Deployment gate

Migration `AddRemainingEditorialMediaSchemas1784610000000` must show as
executed before CMS adoption. Prompt 9B adds no schema migration.

## Write contracts

Use the shared media picker and send nullable UUID fields:

- banner: `imageAssetId`, `mobileImageAssetId`;
- club: `coverImageAssetId`;
- facility: `coverImageAssetId`;
- membership level: `imageAssetId`;
- site setting with `valueType=media_asset`: `mediaAssetId`.

On update, omission preserves the current assignment, `null` clears it, and a
UUID selects a new active image. Missing/deleted, non-image, and inactive new
selections are rejected by the backend. Already-assigned inactive images remain
visible in responses and must remain visible in the form.

Banner desktop and mobile selectors are independent. Do not copy one ID into
the other slot or clear both when only one control changes.

## Club gallery

Send full replacement state only when the gallery editor changed:

```json
{
  "galleryMedia": [
    { "mediaAssetId": "<uuid>", "displayOrder": 0 },
    { "mediaAssetId": "<uuid>", "displayOrder": 1 }
  ]
}
```

Omission preserves, `[]` clears, and a nonempty array replaces atomically.
Asset IDs and orders must be unique. Array order and `displayOrder` must both be
consecutive from zero. The backend validates all gallery assets in one batch.

Use nested summaries returned on the club detail response. Do not query the
media list to rebuild selections. The protected/public detail order is
`displayOrder`, then row `id`.

## Site/shared media

A managed site setting returns both `mediaAsset` and optional `value`. Render
the picker preview from `mediaAsset.url`, falling back to `value` only while
legacy data remains. Never display or persist `storageProvider`, `bucket`,
`storageKey`, MinIO endpoints, or backend filesystem paths.

Reserve this exact editable public placement:

```json
{
  "key": "registration.shared_background",
  "group": "registration",
  "labelEn": "Registration shared background",
  "valueType": "media_asset",
  "mediaAssetId": "<uuid-or-null>",
  "isPublic": true,
  "isEditable": true
}
```

Create it once when the CMS adopts the placement; subsequent updates only
change `mediaAssetId`. The backend does not seed a fake source or assignment.

## Legacy import

Operations runs `npm run import:editorial-media` first in dry-run and then with
`--apply`. CMS code must not clear legacy URL fields during this transition.
See `docs/EDITORIAL_MEDIA_IMPORT.md` for the report and safety contract.
