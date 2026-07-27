# Service legacy media import

## Purpose and scope

`npm run import:service-media` is the one-time, rerunnable transition for these
unassigned legacy slots:

| Entity          | Legacy field     | Managed relation   |
| --------------- | ---------------- | ------------------ |
| Service         | `imageUrl`       | `imageAsset`       |
| Service variant | `imageUrl`       | `imageAsset`       |
| Service variant | `bannerImageUrl` | `bannerImageAsset` |
| Service variant | `modelImageUrl`  | `modelImageAsset`  |

The command does not clear or replace an existing asset relation and does not
drop or rewrite legacy URL columns. It does not import post covers or deferred
banner, club, facility, membership, and site-setting slots.

## Safe execution

Apply migrations through `AddMediaReferenceSafety1784350800000` before running
the importer. A dry-run still queries the asset-ID columns and intentionally
fails rather than guessing against a pre-media schema.

Dry-run is the default:

```text
npm run import:service-media -- -- --source-dir="D:\Personal Project\ctg-app-frontend\public" --report=service-media-dry-run.json
```

Apply only after reviewing the report:

```text
npm run import:service-media -- -- --apply --source-dir="D:\Personal Project\ctg-app-frontend\public" --report=service-media-apply.json
```

Optional controls are `--timeout-ms=<positive integer>` (default `5000`) and
`--max-redirects=<non-negative integer>` (default `3`). The normal managed-media
configuration supplies the byte and MIME allowlists. An apply run exits nonzero
when any field remains unresolved.

The report always contains `imported`, `planned`, `skipped`, `failed`, and
`stillUnresolved` arrays plus matching summary counts. Dry-run candidates are
listed under `planned` and remain under `stillUnresolved` because no database or
storage write occurred.

## Source policy

HTTP(S) sources must be credential-free and use standard ports. Every request
and redirect is DNS-resolved before connecting. The importer rejects a host if
any returned address is loopback, private, link-local, carrier-grade NAT,
documentation/reserved, multicast, or otherwise outside the accepted global
IPv4/IPv6 ranges. The request connects to the validated address while retaining
the original host for HTTP Host and TLS verification. Response time, redirect
count, declared size, streamed size, Content-Type, binary image signature,
dimensions, and the configured MIME allowlist are enforced. Only JPEG, PNG,
GIF, and WebP can pass the current image inspector.

A value such as `/images/services/card.png` is never treated as a remotely
fetchable backend path. It requires `--source-dir`, is resolved below that real
directory, and is rejected if traversal or symlink resolution escapes the
directory. Missing source files remain unresolved; no broken `MediaAsset` row is
created.

## Idempotency and deduplication

Image bytes are hashed with SHA-256. The importer first reuses the oldest active
managed image with the same checksum and current storage provider when its
stored object still exists. Otherwise it uses this deterministic key:

```text
imports/services/<sha256>.<detected extension>
```

If the object already exists after an interrupted run, the importer reuses it
instead of overwriting it. Concurrent deterministic-object creation and a
unique storage-key database race are recovered by checking the object and
loading the winning active media row. Slot assignment is performed under a
pessimistic row lock and is skipped if another process assigned the slot or
changed its legacy URL. A successful second run therefore finds no candidate
fields and performs no storage or database writes.

Imported assets use `usage=general`, `type=image`, `isActive=true`, detected
MIME/dimensions/size, the original source filename, and the managed public URL.
The general usage avoids inventing ownership; the explicit fixed-slot foreign
key remains the placement source of truth.
