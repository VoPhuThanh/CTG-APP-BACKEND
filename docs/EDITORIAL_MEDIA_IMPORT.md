# Remaining editorial media import

## Scope

`npm run import:editorial-media` backfills managed assets for:

- banner `imageUrl` and `mobileImageUrl` independently;
- club `coverImageUrl`;
- every `galleryImageUrls` item in legacy array order;
- facility `coverImageUrl`;
- membership-level `imageUrl`;
- site settings whose type is `image_url`, or already `media_asset`, and whose
  `value` contains a legacy image source.

It does not import services, service variants, post content, or frontend-owned
files that are not represented by an existing backend record. Those domains
retain their dedicated import commands.

## Safe operation

Dry-run is the default:

```text
npm run import:editorial-media -- --source-dir=D:\path\to\frontend\public --report=D:\reports\editorial-media-dry-run.json
```

Apply writes only with the explicit flag:

```text
npm run import:editorial-media -- --apply --source-dir=D:\path\to\frontend\public --report=D:\reports\editorial-media-apply.json
```

Optional limits are `--timeout-ms=<positive integer>` and
`--max-redirects=<non-negative integer>`. Unknown arguments fail before the
application context is created.

Frontend-relative sources are never guessed. They require `--source-dir`, are
resolved beneath its real path, reject traversal/symlink escape, and must point
to a real file. Missing files are reported and no `MediaAsset` is created.

Remote HTTP(S) imports require credential-free URLs on standard ports. Every
redirect is revalidated. DNS resolves only to public addresses and the request
is pinned to the validated address. Timeout, redirect, configured upload-size,
declared content type, allowed type, MIME/byte agreement, and full image parsing
checks are applied before storage.

## Idempotency and assignments

Managed slots are never overwritten. A second run reports their legacy sources
as `managed_assignment_exists` or `managed_gallery_exists`. Asset bytes are
deduplicated by active image checksum plus the configured storage provider, and
deterministic objects use `imports/editorial/<sha256>.<extension>`.

Club galleries are all-or-nothing at the relation layer. Every source is read
and validated first; the ordered rows are then inserted in one database
transaction with consecutive orders starting at zero. If the legacy array or a
managed assignment changes during the run, the importer skips the stale plan.

Legacy fields are not cleared. Imported site settings change to
`valueType=media_asset`, attach `mediaAssetId`, and retain the previous public
URL in `value` as the transition fallback.

## Report contract

The JSON report contains:

- `imported`: assignments committed by an apply run;
- `planned`: valid assignments found by a dry-run;
- `skipped`: protected existing assignments or concurrent changes;
- `failed`: unreadable, unsafe, oversized, or invalid sources;
- `unresolved`: every source still lacking an assignment after this run;
- `summary`: counts for each section.

An apply command exits nonzero when `unresolved` is nonempty. Review and retain
both dry-run and apply reports as deployment evidence.
