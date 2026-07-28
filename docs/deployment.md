# Backend deployment

The production target is Railway for the NestJS process and PostgreSQL, plus
Cloudflare R2 (or another S3-compatible service) for managed media. Normal
application startup does not run migrations, seeds, or data/object migrations.

## Railway service settings

Configure the backend service with:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Pre-deploy command | `npm run migration:run:prod` |
| Start command | `npm run start:prod` |
| Healthcheck path | `/health/ready` |

`/health/live` confirms that the process is running without querying the
database. `/health/ready` runs `SELECT 1` and returns HTTP 503 without database
error details when PostgreSQL is unavailable. The legacy `/health` route remains
an alias of readiness.

Railway provides `PORT`. Set `HOST=0.0.0.0`. Do not put a path or trailing slash
in a CORS origin.

## Environment variables

`Required` means the variable must be present for that mode. Variables marked
`Conditional` are required only for the selected configuration.

| Variable | Local | Production | Secret | Example placeholder | Purpose |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | Optional | Required | No | `production` | Enables production validation and defaults. |
| `HOST` | Optional | Required | No | `0.0.0.0` | NestJS bind host. It is not the database host. |
| `PORT` | Optional | Platform-provided | No | `3000` | NestJS listen port. |
| `ENABLE_SWAGGER` | Optional | Optional | No | `false` | Swagger is on by default outside production and off by default in production. |
| `CORS_ORIGINS` | Optional | Required | No | `https://cms.example.com,https://www.example.com` | Preferred exact comma-separated browser origins. |
| `FRONTEND_URLS` / `FRONTEND_URL` | Optional legacy fallback | Optional legacy fallback | No | `https://www.example.com` | Backward-compatible CORS fallback only when `CORS_ORIGINS` is absent. |
| `CMS_URLS` / `CMS_URL` | Optional legacy fallback | Optional legacy fallback | No | `https://cms.example.com` | Backward-compatible CORS fallback only when `CORS_ORIGINS` is absent. |
| `JWT_SECRET` | Required | Required | Yes | `<long-random-secret>` | JWT signing and verification secret; production requires at least 32 characters. |
| `JWT_EXPIRES_IN` | Optional | Required | No | `1d` | Positive JWT duration such as `15m`, `12h`, or `1d`. |
| `DATABASE_URL` | Optional | Required unless separate variables are complete | Yes | `postgresql://user:password@host:5432/database` | Railway PostgreSQL connection URL. |
| `DATABASE_HOST` | Required without URL | Required without URL | No | `localhost` | PostgreSQL host. Development still accepts legacy `HOST` only when `DATABASE_HOST` is absent. |
| `DATABASE_PORT` | Required without URL | Required without URL | No | `5433` | PostgreSQL port. Compose publishes 5433 by default. |
| `DATABASE_USER` | Required without URL | Required without URL | No | `admin` | PostgreSQL user. |
| `DATABASE_PASSWORD` | Required without URL | Required without URL | Yes | `<database-password>` | PostgreSQL password. |
| `DATABASE_NAME` | Required without URL | Required without URL | No | `project_db` | PostgreSQL database name. |
| `DATABASE_SSL` | Optional | Required by policy | No | `true` | Enables TLS for PostgreSQL. Use the Railway connection requirements. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Optional | Optional | No | `true` | Defaults to certificate verification. Set `false` only when the provider explicitly requires it. |
| `DATABASE_EXPOSED_PORT` | Optional Compose only | No | No | `5433` | Host port published by local Compose. |
| `MEDIA_STORAGE_PROVIDER` | Optional | Required | No | `s3` | `local`, `minio`, or `s3`. Production validation requires `s3`. |
| `MEDIA_PUBLIC_BASE_URL` | Optional for local | Required | No | `https://media.example.com` | Browser-facing bucket/custom-domain root. It is separate from the S3 API endpoint. |
| `MEDIA_UPLOAD_DIRECTORY` | Optional | Ignored by S3 writes | No | `uploads/media` | Local-provider filesystem directory. |
| `MEDIA_PUBLIC_PATH` | Optional | Optional | No | `/uploads/media` | URL path used only by the local provider. |
| `MEDIA_CACHE_CONTROL` | Optional | Optional | No | `public, max-age=31536000, immutable` | Object cache metadata. |
| `MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES` | Optional | Optional | No | `10485760` | Maximum managed upload size. |
| `MEDIA_UPLOAD_ALLOWED_MIME_TYPES` | Optional | Optional | No | `image/jpeg,image/png,image/gif,image/webp` | Allowed raster-image MIME types. |
| `MINIO_ENDPOINT` | Required for `minio` | No | No | `localhost` | Local MinIO hostname without scheme or path. |
| `MINIO_PORT` | Optional for `minio` | No | No | `9000` | Local MinIO S3 API port. |
| `MINIO_USE_SSL` | Optional for `minio` | No | No | `false` | Local MinIO TLS flag. |
| `MINIO_ACCESS_KEY` | Required for `minio` | No | Yes | `<local-access-key>` | Local MinIO access key. |
| `MINIO_SECRET_KEY` | Required for `minio` | No | Yes | `<local-secret-key>` | Local MinIO secret key. |
| `MINIO_BUCKET` | Required for `minio` | No | No | `ctg-media` | Local MinIO bucket. |
| `MINIO_REGION` | Optional for `minio` | No | No | `us-east-1` | Local MinIO region. |
| `MEDIA_STORAGE_ENDPOINT` | No | Required for `s3` | No | `https://account-id.r2.cloudflarestorage.com` | Internal S3 API endpoint; not serialized to clients. |
| `MEDIA_STORAGE_REGION` | No | Required for `s3` | No | `auto` | S3/R2 region. |
| `MEDIA_STORAGE_BUCKET` | No | Required for `s3` | No | `ctg-media` | Production bucket name. |
| `MEDIA_STORAGE_ACCESS_KEY_ID` | No | Required for `s3` | Yes | `<r2-access-key-id>` | S3 upload credential. |
| `MEDIA_STORAGE_SECRET_ACCESS_KEY` | No | Required for `s3` | Yes | `<r2-secret-access-key>` | S3 upload credential. |
| `MEDIA_STORAGE_FORCE_PATH_STYLE` | No | Optional for `s3` | No | `true` | Must remain `true` for the existing S3-compatible client and R2 configuration. |
| `ADMIN_USERNAME` | Seed only | Seed only | No | `admin` | Explicit one-time admin username. |
| `ADMIN_PASSWORD` | Seed only | Seed only | Yes | `<strong-one-time-password>` | Explicit one-time admin password; never logged. |
| `ADMIN_STAFF_ID` | Seed only | Seed only | No | `ADMIN-001` | Required unique staff identifier for the seeded admin. |

Do not expose database, JWT, or storage credentials through `NEXT_PUBLIC_*`
variables. `MEDIA_PUBLIC_BASE_URL` is public by design; storage credentials and
`MEDIA_STORAGE_ENDPOINT` are not.

## Vercel integration values

After Railway and the public media hostname are live, set the existing public
frontend Vercel project to:

```text
API_BASE_URL=https://<railway-backend-host>
NEXT_PUBLIC_API_BASE_URL=https://<railway-backend-host>
MEDIA_PUBLIC_BASE_URL=https://<public-media-bucket-or-custom-domain-root>
MEDIA_ALLOW_LOCAL_IP=false
```

`API_BASE_URL` covers server-component requests. `NEXT_PUBLIC_API_BASE_URL`
covers browser-side lead submission. `MEDIA_PUBLIC_BASE_URL` drives the
frontend's precise Next.js image pattern and its legacy local-MinIO URL
replacement helper.

Set the CMS Vercel project to:

```text
NEXT_PUBLIC_API_BASE_URL=https://<railway-backend-host>
```

The CMS consumes media URLs from backend DTOs and needs no separate media
variable. Redeploy each Vercel project after changing environment variables.
Set backend CORS to the two exact browser origins:

```text
CORS_ORIGINS=https://<cms-vercel-origin>,https://<public-frontend-vercel-origin>
```

Do not use paths, wildcards, or trailing slashes.

## Database initialization and migration

For an empty production database:

1. Create a Railway managed PostgreSQL service.
2. Attach its `DATABASE_URL` to the backend service.
3. Set the explicit SSL flags required by the Railway connection.
4. Build with `npm run build`.
5. Run `npm run migration:run:prod` once as the pre-deploy command.
6. Start with `npm run start:prod`.
7. On a fresh database, optionally run `npm run seed:permissions:prod` once to
   create the complete idempotent permission catalog.
8. If an initial administrator is needed, set the three `ADMIN_*` variables and
   manually run `npm run seed:prod` once. Remove the admin password variable
   afterward if operational policy permits.

The admin seed is idempotent for the configured username/staff ID. It refuses a
conflicting existing assignment and never prints the password. Permission
seeding is not part of normal startup.

### Moving an existing PostgreSQL database

Stop writes or schedule a maintenance window before the final dump. Use a fresh
target database; do not restore over an unknown populated database.

```sh
pg_dump --format=custom --no-owner --no-acl --dbname="$SOURCE_DATABASE_URL" --file=ctg-app.dump
pg_restore --no-owner --no-acl --exit-on-error --dbname="$TARGET_DATABASE_URL" ctg-app.dump
npm run build
npm run migration:run:prod
```

The dump contains the TypeORM migrations table. The final migration command
applies only migrations that were not present in the source database.

## Media migration from MinIO to R2

Create the R2 bucket and public delivery hostname first. The public base URL
must represent the bucket root; the backend appends the encoded storage key.
The R2 S3 API endpoint and public delivery URL are different values.

Use MinIO Client (`mc`) or an equivalent S3 copy tool from a trusted workstation.
The following is an operator-run outline, not an application startup step:

```sh
mc alias set local http://localhost:9000 "$LOCAL_MINIO_ACCESS_KEY" "$LOCAL_MINIO_SECRET_KEY"
mc alias set r2 https://account-id.r2.cloudflarestorage.com "$R2_ACCESS_KEY_ID" "$R2_SECRET_ACCESS_KEY"
mc mirror --dry-run "local/ctg-media" "r2/ctg-media"
mc mirror --overwrite "local/ctg-media" "r2/ctg-media"
```

Verify object counts and representative checksums before changing the backend.
Do not treat the Compose `minio_data` volume as a portable deployment artifact.

Managed database rows use `storageKey` as canonical identity. If the production
bucket name or provider label changes, audit first:

```sh
npm run normalize:media-storage:prod -- --from-provider=minio --from-bucket=ctg-media --to-provider=s3 --to-bucket=ctg-media
```

The command is dry-run by default and reports only counts and target metadata.
After the object copy and backup review, repeat with `--apply`. It updates only
rows matching the exact source provider and bucket, including soft-deleted
metadata. Use `--from-bucket=null` only when normalizing legacy local-provider
rows that correctly have no bucket.

Transitional external media rows have no managed storage key. If they contain an
old exact localhost bucket base, audit them separately:

```sh
npm run normalize:legacy-media-urls:prod -- --from-base=http://localhost:9000/ctg-media --to-base=https://media.example.com
```

This is also dry-run by default. It targets only exact source-base prefixes in
the known legacy media fields for media assets, banners, clubs (including
gallery arrays), facilities, memberships, post covers, services/variants, and
media-valued site settings. It reports matching record IDs without printing the
stored URLs. After verifying that the corresponding objects exist at the
destination, repeat with `--apply`. Other external URLs and post content-source
URLs are not changed. Production media-asset serialization refuses unsafe local
URL-only assets so they cannot leak through that contract.

## Local Docker development

Copy `.env.example` to `.env`, replace local placeholders, then run:

```sh
docker compose up -d database minio minio-init
npm run migration:run
npm run dev
```

Compose uses the persistent named volumes `postgres_data` and `minio_data`.
PostgreSQL is published on 5433 by default. MinIO publishes its S3 API on 9000
and console on 9001; `minio-init` creates the configured bucket idempotently.
The application runs on the host and therefore uses `DATABASE_HOST=localhost`
and `MINIO_ENDPOINT=localhost`. Docker service names are local-network details,
not production configuration.

## Deployment smoke checks

1. `GET /health/live` returns HTTP 200.
2. `GET /health/ready` returns HTTP 200 and `database: "connected"`.
3. `/api-docs` is absent unless production Swagger was explicitly enabled.
4. The public frontend origin can call public GET routes and submit a lead.
5. The CMS origin can log in, load `/auth/me`, and call a protected list route.
6. Upload a small image in the CMS, confirm the database records provider `s3`
   and a storage key, and confirm the response URL uses the public media host.
7. Preview and delete/replace flows work without requests to localhost, a
   Docker hostname, or a Cloudflare Quick Tunnel.

## Repository verification

The deployment-readiness implementation was verified on 2026-07-28 with:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- 54 focused application/configuration/storage/health/normalization tests
- compiled metadata discovery: 24 entities and 16 migrations, ending with
  `AddS3StorageProvider1785387600000`
- compiled `dist/main.js` smoke run on a separate local port, with liveness and
  readiness returning 200 and Swagger returning 404 when disabled
- local Compose configuration discovery and running PostgreSQL/MinIO status

The full Jest baseline is not green: 53 suites/247 tests pass and 16 suites/20
tests fail. The failures are existing placeholder Nest test modules with
missing providers plus ordering-aware media/post mocks that lack
`manager.query`; they are separate test-debt and do not fail lint, typecheck,
build, focused deployment tests, compiled migration discovery, or the runtime
smoke check.

Railway, R2, production PostgreSQL restore/migrations, object copying, admin
seeding, and authenticated browser smoke tests were intentionally not executed.
Those are the next operator tasks after real origins and service URLs are known.
