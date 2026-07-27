# Managed Image Storage and Uploads

## Purpose

`MediaAsset` is the single managed-image record used by CMS modules. Binary
files are written through the shared storage-provider boundary under
`src/cores/storage/`; media application logic does not depend on a filesystem,
S3 API, or vendor SDK.

The implemented providers are `local` and `minio`. Local storage remains useful
for single-instance development. MinIO is the managed S3-compatible provider
for shared, domain-portable storage.

## Configuration

| Variable                           | Default                                     | Meaning                                                                    |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `MEDIA_STORAGE_PROVIDER`           | `local`                                     | Registered provider name: `local` or `minio`.                              |
| `MEDIA_UPLOAD_DIRECTORY`           | `uploads/media`                             | Writable local root. Relative values resolve from the process directory.   |
| `MEDIA_PUBLIC_PATH`                | `/uploads/media`                            | Public API route used to serve local objects.                              |
| `MEDIA_PUBLIC_BASE_URL`            | empty                                       | Browser-facing base. Required for MinIO; never use a Docker-only hostname. |
| `MEDIA_CACHE_CONTROL`              | `public, max-age=31536000, immutable`       | Object cache metadata written during managed uploads.                      |
| `MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES` | `10485760`                                  | Multipart and service-level file-size limit.                               |
| `MEDIA_UPLOAD_ALLOWED_MIME_TYPES`  | `image/jpeg,image/png,image/gif,image/webp` | Deployment allowlist, restricted to server-supported raster formats.       |

MinIO additionally requires `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`,
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, and `MINIO_REGION`.
`MINIO_ENDPOINT` is private backend connectivity. `MEDIA_PUBLIC_BASE_URL` is
the browser/CDN/reverse-proxy base and may be a completely different hostname.

Configuration is validated during application bootstrap. Unsupported
providers, missing MinIO settings, SVG, empty allowlists, unsafe public paths,
invalid base URLs, and non-positive size limits fail startup. The local
provider verifies its writable directory. The MinIO provider verifies that the
configured bucket exists and fails startup if bootstrap has not completed.

`uploads/` is ignored by Git. Do not point the upload directory into either
frontend repository and do not use an ephemeral application filesystem in a
production deployment that expects durable media.

## Upload endpoint

`POST /media-assets/upload`

- Authentication: JWT, using the existing guards.
- Required permission: `media-assets:create`; `media-assets:*` and
  `system:admin` continue to work through the existing guard.
- Content type: `multipart/form-data`.
- Required parts: binary `file` and text `name`.
- Optional fields: `altTextEn`, `altTextVi`, `descriptionEn`, `descriptionVi`,
  `usage`, `isActive`, and `displayOrder`.

The endpoint returns `MediaAssetResponseDto`, including `id`, public `url`,
`storageProvider`, `storageKey`, normalized `mimeType`, dimensions, byte size,
SHA-256 `checksum`, sanitized `originalFilename`, localized alternative text,
and standard audit metadata. Internal filesystem paths are never serialized.

Example:

```text
curl -X POST http://localhost:3000/media-assets/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@hero.png;type=image/png" \
  -F "name=Homepage hero" \
  -F "altTextEn=People training at CTG Fitness" \
  -F "altTextVi=Mọi người đang tập luyện tại CTG Fitness" \
  -F "usage=banner"
```

With MinIO development configuration, a returned URL such as
`http://localhost:9000/ctg-media/images/2026/07/<uuid>.png` is derived at
response time. NestJS may connect to `localhost:9000` when it runs on the host,
or `minio:9000` when it runs in the Compose network. Browser responses never
contain `http://minio:9000`.

## Image validation and preservation

Supported formats are JPEG, PNG, GIF, and WebP. SVG, HTML, documents, videos,
and other file types are rejected by this endpoint.

Validation does not trust the browser filename, extension, or MIME header. The
server parses the binary container/signature, validates required structure,
reads width and height, normalizes MIME metadata from content, and requires the
declared MIME type to match. The deployment allowlist is then applied to the
detected type.

The first implementation preserves original raster bytes. It does not resize,
re-encode, strip animation, or convert formats, avoiding unexpected loss of
transparency, animation, or image quality. Image normalization can be added
later as a separate explicit policy behind a tested image-processing boundary.

Storage keys use this server-controlled shape:

```text
images/<UTC year>/<UTC month>/<random UUID>.<detected extension>
```

Client filenames are retained only as sanitized display/audit metadata. The
local provider accepts only relative POSIX-style keys and independently rejects
absolute paths, backslashes, empty segments, null bytes, `.` and `..` segments,
and any resolved path outside the configured root.

## Persistence and cleanup

Upload order is:

1. authorize and resolve the current audit user;
2. validate file size, declared MIME, actual image structure, and dimensions;
3. write the object through the provider;
4. save the `MediaAsset` row;
5. return the mapped response.

Provider write failures trigger idempotent compensating deletion of the
server-generated key and never attempt a database insert. Database create/save
failures also delete the stored object. The local provider publishes a complete
temporary file with a no-overwrite hard-link operation, so a failed write does
not expose a partial target object.

Storage and PostgreSQL cannot share a transaction. If compensating deletion
itself fails, the original failure is preserved and the cleanup failure is
logged with the storage key for operational reconciliation.

Normal `DELETE /media-assets/:id` checks the centralized relational usage
registry first. It returns `409 MEDIA_ASSET.IN_USE` with the usage report when
any fixed-slot reference remains. An unreferenced asset is soft-deleted in the
database and the binary is deliberately retained.

`MediaAssetOrphanCleanupService.assessForPhysicalDeletion(assetId,
deletedBefore)` is the conservative future-job boundary. Eligibility requires
a managed storage provider/key pair, a soft-delete timestamp at or before the
caller-supplied retention cutoff, and zero references at assessment time. The
current application has no purge endpoint or scheduled purge job. A future job
must recheck references immediately before provider deletion, retry provider
failures, and record an audit trail. See `docs/MEDIA_LIFECYCLE.md`.

## Managed versus external records

Managed assets always have `storageProvider` and `storageKey`; MinIO records
also have `bucket`. Their database `url` is nullable compatibility state and is
not their identity. Transitional external/legacy URL records have provider,
bucket, and key null and retain their URL. Migration
`1784264400000-add-media-storage-provider.ts` labels any existing non-null
Prompt 1 key with provider `legacy` and adds a database check constraint that
keeps provider/key state paired.

Migration `1784437200000-add-minio-storage-portability.ts` adds `bucket`, makes
`url` nullable, constrains MinIO bucket state, and clears persisted URLs from
existing local managed records. Changing `MEDIA_PUBLIC_BASE_URL` therefore
changes mapped URLs without rewriting asset rows.

`POST /media-assets` remains only for transitional URL-only external records.
It cannot set provider, key, checksum, or original filename. Managed URL,
type, MIME, dimensions, and file size are immutable through
`PATCH /media-assets/:id`; uploading a replacement must create a new asset and
the consuming record must explicitly adopt the new asset ID.

## Local MinIO setup and persistence

Start the infrastructure and idempotent bucket bootstrap:

```text
docker compose up -d database minio minio-init
docker compose ps
```

The S3 API is on `http://localhost:9000`; the development console is on
`http://localhost:9001`. Use only local development credentials from `.env`.
Production credentials must come from the deployment secret manager and must
not be committed or exposed to clients.

`postgres_data` remains the existing PostgreSQL named volume.
`minio_data` persists `/data`. Re-running `docker compose up -d` is
non-destructive. Do not use `docker compose down -v` for ordinary setup or
restart.

The current Compose file contains infrastructure only; NestJS normally runs on
the host. `minio-init` waits for MinIO health before creating the bucket and
anonymous download policy, and the backend verifies bucket readiness on
startup. A future containerized backend service must depend on successful
`minio-init`.

## Existing local-file transfer

The repository upload directory was inspected on 2026-07-16 and contained no
files, so this migration has no local binaries to transfer. If another
environment contains local managed objects, use this idempotent procedure:

1. Back up PostgreSQL and the local upload root.
2. Run `mc mirror --dry-run <local-upload-root> local/<bucket>` and save the
   report.
3. Run `mc mirror <local-upload-root> local/<bucket>`.
4. Verify object counts/checksums.
5. In one reviewed database transaction, update only rows with
   `storage_provider = 'local'` and a non-null `storage_key` to
   `storage_provider = 'minio'`, set `bucket` to the deployed bucket, and set
   `url = NULL`.
6. Run the dry-run again; it should report no copies.

Do not relabel rows until their bytes exist at the same storage keys in MinIO.

## Production deployment and backups

Expose public media through HTTPS, normally via a reverse proxy or CDN.
`MEDIA_PUBLIC_BASE_URL` must be reachable by CMS/frontend browsers and must not
contain credentials. Keep the MinIO console private.

Back up PostgreSQL metadata and MinIO object data as one operational set.
Restoring only one side can leave references without objects or objects without
metadata. Test restores and retention policy before enabling any future
physical purge job.

## Adding another provider

Implement `StorageProvider` with `write`, idempotent `delete`, and `exists`.
Public URL resolution remains centralized in
`media-asset-url.resolver.ts`; provider SDK code must not leak into application
services or mappers.
