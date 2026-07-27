# Service Variant Detail: Backend-to-CMS Handoff

## 1. Feature goal

Extend service variants so the CMS can manage all content needed by a future public variant-detail page:

- the existing card/thumbnail image;
- a separate wide banner image;
- a separate promotional/model image;
- duration, calorie range, and skill level;
- exact club availability for the variant;
- localized short and long descriptions.

The backend remains the authoritative contract and validation layer. This handoff describes the final backend state the CMS must now consume.

## 2. Final backend contract

`imageUrl` has not changed meaning: it remains the variant card/thumbnail image.

The two new image fields are:

```ts
bannerImageUrl: string | null;
modelImageUrl: string | null;
```

All three image fields are URL/path strings. The contract supports both absolute HTTP(S) URLs and repository-local public paths beginning with `/`.

Exact availability is represented by `ServiceVariant.clubs`. This differs from `Service.clubs`:

- `Service.clubs`: clubs that generally offer the service category;
- `ServiceVariant.clubs`: clubs where that exact variant is available.

The required invariant is:

```text
variant.clubs ⊆ variant.service.clubs
```

Internal service responses expose parent-service club summaries so the CMS can restrict the variant selector. Internal variant responses expose the variant's selected club summaries. The new public detail response exposes only eligible published clubs.

## 3. Entity and database changes

### `ServiceVariant`

Added nullable text-backed properties:

```ts
bannerImageUrl: string | null;
modelImageUrl: string | null;
```

Added an owning many-to-many relation:

```ts
clubs: Club[];
```

The relation uses the explicitly named `service_variant_clubs` join table with:

- `service_variant_id`;
- `club_id`;
- composite primary key on both columns;
- an index on each column;
- cascading foreign keys to `service_variants.id` and `clubs.id`.

### `Club`

Added the inverse relation:

```ts
serviceVariants: ServiceVariant[];
```

The inverse metadata uses cascade update/delete behavior so TypeORM metadata matches the migrated database schema.

No `MediaAsset` entity relationship was added.

## 4. Migration details

Migration:

```text
src/database/migrations/1784091600000-add-service-variant-detail.ts
```

`up()` performs the following operations in order:

1. Adds nullable `service_variants.banner_image_url` as `text`.
2. Adds nullable `service_variants.model_image_url` as `text`.
3. Creates `service_variant_clubs` with a composite primary key.
4. Creates indexes for `service_variant_id` and `club_id`.
5. Adds cascade foreign keys to `service_variants` and `clubs`.
6. Backfills every existing variant with the clubs attached to its parent service through `club_services`.

The backfill is equivalent to:

```text
service_variants.service_id -> club_services.service_id -> club_services.club_id
```

It uses `ON CONFLICT (service_variant_id, club_id) DO NOTHING`, so it is nonduplicating and works when a service has no clubs.

`down()` removes both foreign keys, both indexes, the join table, then `model_image_url` and `banner_image_url` in dependency-safe order.

The migration was applied to the configured development database, inspected, reverted, and rerun. The final database state has the migration applied. TypeORM `schema:log` reports no pending schema synchronization queries.

## 5. Request DTO changes

The following fields were added to both the internal create and update DTOs:

```ts
bannerImageUrl?: string | null;
modelImageUrl?: string | null;
clubIds?: string[];
```

`imageUrl` was retained and is now explicitly typed as:

```ts
imageUrl?: string | null;
```

### Create semantics

For `POST /services/:serviceId/variants`:

| Input               | Backend behavior                                            |
| ------------------- | ----------------------------------------------------------- |
| `clubIds` omitted   | Inherit all clubs currently attached to the parent service. |
| `clubIds: []`       | Create with no exact club availability.                     |
| `clubIds: [ids...]` | Deduplicate, validate, and assign that exact subset.        |

### Update semantics

For `PATCH /services/:serviceId/variants/:variantId`:

| Input               | Backend behavior                                    |
| ------------------- | --------------------------------------------------- |
| `clubIds` omitted   | Preserve current variant club assignments.          |
| `clubIds: []`       | Clear all variant club assignments.                 |
| `clubIds: [ids...]` | Deduplicate, validate, and replace all assignments. |

The distinction between an omitted property and an empty array is contractually significant.

### Existing request fields

Create still requires:

```ts
nameEn: string;
nameVi: string;
```

Create and update support these optional fields:

```ts
slug?: string;
shortDescriptionEn?: string;
shortDescriptionVi?: string;
descriptionEn?: string;
descriptionVi?: string;
imageUrl?: string | null;
bannerImageUrl?: string | null;
modelImageUrl?: string | null;
durationMinutes?: number;
caloriesBurnedMin?: number;
caloriesBurnedMax?: number;
skillLevel?: ServiceSkillLevel;
status?: ServiceStatus;
displayOrder?: number;
isFeatured?: boolean;
clubIds?: string[];
```

## 6. Serialized response changes

Entities are not returned directly. The following are serialized DTO contracts.

### Internal service response

`ServiceResponseDto` now includes:

```ts
clubs: Array<{
  id: string;
  nameEn: string;
  nameVi: string;
  slug: string;
  status: ClubStatus;
}>;
```

This is the CMS source for valid club choices for a variant under that service. It is a summary only and does not contain recursive club/service graphs.

The existing `variants` and `metadata` fields remain present.

### Internal variant response

`ServiceVariantResponseDto` now serializes:

```ts
{
  id: string;
  serviceId: string;
  nameEn: string;
  nameVi: string;
  slug: string;
  shortDescriptionEn: string | null;
  shortDescriptionVi: string | null;
  descriptionEn: string | null;
  descriptionVi: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  modelImageUrl: string | null;
  durationMinutes: number | null;
  caloriesBurnedMin: number | null;
  caloriesBurnedMax: number | null;
  skillLevel: ServiceSkillLevel;
  status: ServiceStatus;
  displayOrder: number;
  isFeatured: boolean;
  clubs: Array<{
    id: string;
    nameEn: string;
    nameVi: string;
    slug: string;
    status: ClubStatus;
  }>;
  metadata: MetadataResponseDto;
}
```

Internal variant clubs are sorted deterministically by `displayOrder`, then `nameEn`, then `id`. `displayOrder` is used for sorting but is not included in the internal club summary.

### Public variant list/card response

The paginated public variant-card DTO remains lightweight. It has not gained `bannerImageUrl`, `modelImageUrl`, service summaries, or club summaries.

The response remains:

```ts
{
  data: PublicServiceVariantResponseDto[];
  meta: PaginationMetaDto;
}
```

### New public variant detail response

`PublicServiceVariantDetailResponseDto` serializes:

```ts
{
  id: string;
  serviceId: string;
  nameEn: string;
  nameVi: string;
  slug: string;
  shortDescriptionEn: string | null;
  shortDescriptionVi: string | null;
  descriptionEn: string | null;
  descriptionVi: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  modelImageUrl: string | null;
  durationMinutes: number | null;
  caloriesBurnedMin: number | null;
  caloriesBurnedMax: number | null;
  skillLevel: ServiceSkillLevel;
  displayOrder: number;
  isFeatured: boolean;
  service: {
    id: string;
    nameEn: string;
    nameVi: string;
    slug: string;
  }
  clubs: Array<{
    id: string;
    nameEn: string;
    nameVi: string;
    slug: string;
    displayOrder: number;
  }>;
}
```

The public detail response intentionally excludes internal status and audit metadata. Its `clubs` array contains only published, non-soft-deleted clubs and is sorted by `displayOrder`, `nameEn`, then `id`.

## 7. Enum values and nullability

### `ServiceStatus`

```ts
type ServiceStatus = 'draft' | 'published' | 'archived';
```

This enum is used by both services and service variants.

### `ServiceSkillLevel`

```ts
type ServiceSkillLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'all_levels';
```

Create defaults to `all_levels` when `skillLevel` is omitted.

### `ClubStatus`

```ts
type ClubStatus = 'draft' | 'published' | 'archived';
```

### Nullability

The serialized variant fields below are always present and may be `null`:

- `shortDescriptionEn`;
- `shortDescriptionVi`;
- `descriptionEn`;
- `descriptionVi`;
- `imageUrl`;
- `bannerImageUrl`;
- `modelImageUrl`;
- `durationMinutes`;
- `caloriesBurnedMin`;
- `caloriesBurnedMax`.

Collections are serialized as arrays, including empty arrays; do not treat them as nullable.

Request image fields may be omitted or explicitly sent as `null`. On update, omission preserves the existing value and `null` clears it.

## 8. Controller routes and HTTP methods

### CMS/internal routes

| Method   | Route                                      | Purpose                                                          |
| -------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `GET`    | `/services/:id`                            | Load a service, its variants, and parent-service club summaries. |
| `GET`    | `/services/:serviceId/variants`            | Paginated internal variant list with selected club summaries.    |
| `POST`   | `/services/:serviceId/variants`            | Create a variant.                                                |
| `GET`    | `/services/:serviceId/variants/:variantId` | Load one internal variant with selected club summaries.          |
| `PATCH`  | `/services/:serviceId/variants/:variantId` | Update scalar fields and optionally replace club assignments.    |
| `DELETE` | `/services/:serviceId/variants/:variantId` | Soft-delete a variant.                                           |

The internal variant list accepts the existing pagination/search/sort query contract. Documented sortable fields are `nameEn`, `nameVi`, `slug`, `status`, `skillLevel`, `durationMinutes`, `displayOrder`, `createdAt`, and `updatedAt`.

### Public routes

| Method | Route                                                 | Purpose                                         |
| ------ | ----------------------------------------------------- | ----------------------------------------------- |
| `GET`  | `/services/public/:serviceSlug/variants`              | Existing paginated published variant-card list. |
| `GET`  | `/services/public/:serviceSlug/variants/:variantSlug` | New published variant detail.                   |
| `GET`  | `/services/public/:slug`                              | Existing published service detail.              |

The nested public variant-detail route is registered before the generic public service-slug route.

## 9. Authorization requirements

Internal routes use backend permissions:

| Operation                     | Required declared permission |
| ----------------------------- | ---------------------------- |
| List/read service or variants | `services:read`              |
| Create service variant        | `services:create`            |
| Update service variant        | `services:update`            |
| Delete service variant        | `services:delete`            |

The existing permission guard also handles `system:admin`, module wildcard, and exact-permission overrides. The CMS may use permissions to control UI visibility, but backend authorization remains authoritative.

The public service and variant routes do not use `@Authorized` and do not require CMS authentication. The controller-level Swagger bearer annotation does not itself make those routes protected.

## 10. Validation and error behavior

### Field validation

- `nameEn` and `nameVi`: strings, maximum 150 characters; required on create.
- `slug`: optional string, maximum 180 characters, lowercase alphanumeric words separated by single hyphens. If omitted on create, it is generated from `nameEn`.
- localized descriptions: optional strings.
- all three image fields: optional nullable strings. The CMS must allow absolute HTTP(S) URLs and `/`-prefixed public paths.
- `durationMinutes`: optional integer, minimum 1.
- `caloriesBurnedMin`: optional integer, minimum 0.
- `caloriesBurnedMax`: optional integer, minimum 0, maximum 5000.
- `skillLevel`: one of the exact `ServiceSkillLevel` values.
- `status`: one of the exact `ServiceStatus` values.
- `displayOrder`: optional integer, minimum 0.
- `isFeatured`: optional boolean.
- `clubIds`: optional array of UUID strings.

Submitted club IDs are deduplicated before lookup and assignment.

### Club validation

For every submitted club ID, the backend confirms that:

1. the club exists;
2. the club is not soft-deleted;
3. the club belongs to the parent service.

Create and update execute the variant save and relation changes in one transaction. Validation failure does not partially save the variant.

### Structured errors

Backend application errors serialize as:

```ts
{
  statusCode: number;
  code: string;
  message: string;
}
```

Relevant errors include:

| HTTP  | Code                                  | Meaning                                                                                             |
| ----- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `400` | `SERVICE_VARIANT.CLUB_NOT_IN_SERVICE` | At least one selected club is not attached to the parent service.                                   |
| `401` | `AUTH.REQUIRED`                       | Authentication is missing for an internal write/read requiring it.                                  |
| `401` | `AUTH.CURRENT_USER_NOT_FOUND`         | The authenticated user no longer exists.                                                            |
| `404` | `SERVICE.NOT_FOUND`                   | Parent service is unavailable or, for the public list, not published.                               |
| `404` | `SERVICE_VARIANT.NOT_FOUND`           | Variant is missing, under another service, soft-deleted, or unavailable to the public detail route. |
| `404` | `CLUB.NOT_FOUND`                      | A submitted club ID is missing or soft-deleted.                                                     |
| `409` | `SERVICE_VARIANT.SLUG_ALREADY_EXISTS` | The slug already exists within the parent service.                                                  |

The public detail endpoint returns 404 when the service is draft/deleted, the variant is draft/deleted, or the variant slug belongs to a different service. The CMS must not rely on distinct error messages to infer which unpublished resource exists.

## 11. Important business rules

1. `imageUrl` is the card/thumbnail image and must not be renamed or repurposed.
2. `bannerImageUrl` and `modelImageUrl` are separate detail-page assets.
3. Variant availability is exact availability, not a copy to be inferred at read time from the parent service.
4. Every variant club must be a subset of the parent service's clubs.
5. Create omission inherits current parent clubs; create `[]` explicitly means no clubs.
6. Update omission preserves current assignments; update `[]` explicitly clears them.
7. Submitted club IDs are replacement state, not incremental additions/removals.
8. Parent-service club summaries are the allowed CMS selector options; selected state comes from the variant response's `clubs` array.
9. Internal and public club summaries intentionally differ. Public detail excludes unpublished and soft-deleted clubs.
10. Variant slug uniqueness is scoped to the parent service.
11. Variants and services retain soft-delete and audit behavior.
12. Club ordering is deterministic and should not be re-sorted by localized display text unless the product explicitly changes that requirement.

## 12. Files changed for this backend feature

Created:

- `src/database/migrations/1784091600000-add-service-variant-detail.ts`
- `src/modules/services/service-variant-detail.migration.spec.ts`
- `docs/handoffs/service-variant-detail-backend-to-cms.md`

Modified:

- `src/cores/errors/app-error-code.ts`
- `src/cores/errors/app-error-message.ts`
- `src/modules/clubs/entities/club.entity.ts`
- `src/modules/services/entities/service-variant.entity.ts`
- `src/modules/services/dtos/create-service-variant.dto.ts`
- `src/modules/services/dtos/update-service-variant.dto.ts`
- `src/modules/services/dtos/service-variant.dto.ts`
- `src/modules/services/dtos/service.dto.ts`
- `src/modules/services/dtos/public-service.dto.ts`
- `src/modules/services/services.mapper.ts`
- `src/modules/services/services.service.ts`
- `src/modules/services/services.controller.ts`
- `src/modules/services/services.service.spec.ts`
- `src/modules/services/services.controller.spec.ts`

The repository contains other pre-existing staged and unstaged changes. They are not part of this feature list.

## 13. Backend validation commands and results

| Command/check                                                                | Result                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted Prettier on changed feature files                                   | Passed.                                                                                                                                                             |
| `npm run lint`                                                               | Passed with 0 errors and 2 pre-existing floating-promise warnings in `src/main.ts` and `src/database/seeds/admin-seeds.ts`.                                         |
| `npm run typecheck`                                                          | Passed.                                                                                                                                                             |
| `npm run build`                                                              | Passed.                                                                                                                                                             |
| Focused Jest suites for services controller, services service, and migration | 3 suites passed; 21 tests passed.                                                                                                                                   |
| `git diff --check`                                                           | Passed.                                                                                                                                                             |
| TypeORM migration run                                                        | Passed.                                                                                                                                                             |
| TypeORM migration revert                                                     | Passed.                                                                                                                                                             |
| TypeORM migration rerun                                                      | Passed; migration is applied in the final development database state.                                                                                               |
| TypeORM `schema:log`                                                         | Schema is up to date; no synchronization SQL proposed.                                                                                                              |
| Live schema/backfill inspection                                              | 2 image columns, 2 cascade foreign keys, 3/3 inherited assignments, 0 missing assignments, 0 duplicate groups.                                                      |
| Full Jest run                                                                | 4 suites passed and 24 unrelated placeholder suites failed because their test modules do not register required dependencies; 23 tests passed and 24 failed overall. |

## 14. Exact CMS work now required

### API types and client

1. Extend the CMS service-variant request types with nullable `bannerImageUrl`, nullable `modelImageUrl`, and optional `clubIds`.
2. Change the CMS request type for `imageUrl` to `string | null` while preserving its thumbnail meaning.
3. Extend the internal service response type with `clubs: ServiceClubSummary[]`.
4. Extend the internal variant response type with both new image fields and `clubs: ServiceVariantClubSummary[]`.
5. Use the nested internal variant routes already listed; do not invent a new CMS-only route.
6. If the CMS/shared client also defines public contracts, add `PublicServiceVariantDetailResponseDto` and the nested public detail request.
7. Keep the existing public variant-card type unchanged.

### Service variant form

1. Add separate inputs for:
   - card/thumbnail image (`imageUrl`);
   - wide banner image (`bannerImageUrl`);
   - promotional/model image (`modelImageUrl`).
2. Keep these as manual string inputs for now. Accept HTTP(S) URLs and `/`-prefixed local public paths.
3. Add a multi-select for exact club availability.
4. Load the parent service detail and use `service.clubs` as the complete allowed option set.
5. On edit, initialize selected IDs from `variant.clubs.map(club => club.id)`, not from `service.clubs`.
6. Preserve the distinction between `undefined` and `[]` in form-to-request serialization:
   - create untouched/omitted means inherit;
   - create explicit empty means none;
   - update untouched/omitted means preserve;
   - update explicit empty means clear.
7. A safe create UX is either:
   - preselect all parent service clubs and submit those IDs; or
   - track an untouched state and omit `clubIds` so the backend inherits.
     Do not initialize an untouched create form to `[]` and submit it automatically.
8. For update, track whether the club control is dirty. Do not send an empty array merely because options have not loaded yet.
9. Normalize a deliberately cleared image field to `null`. Omit it on update only when the user did not change it.
10. Surface backend structured errors, especially unrelated-club validation and slug conflicts.
11. Use backend permission information to hide or disable create/update/delete controls, while still treating backend authorization as final.

### CMS list/detail presentation

1. Show exact selected club summaries from each variant response where useful.
2. Show the new image fields in the variant detail/edit view.
3. Continue using `imageUrl` for CMS card/thumbnail previews.
4. Treat nullable response fields as normal empty states; do not display `undefined` placeholders.

## 15. Behavior the CMS must not implement or infer

- Do not rename or repurpose `imageUrl` as the banner image.
- Do not implement uploads, object storage, media browsing, or `MediaAsset` relationships in this work.
- Do not assume every variant is available at every parent-service club.
- Do not infer selected variant clubs from `service.clubs`; use `variant.clubs`.
- Do not send `clubIds: []` for an untouched form. Empty array has explicit clearing/no-availability meaning.
- Do not send only added or removed IDs. The backend expects replacement state when `clubIds` is present.
- Do not offer clubs outside `service.clubs` in the selector.
- Do not rely on frontend filtering as authorization or data-integrity enforcement.
- Do not add `bannerImageUrl` or `modelImageUrl` to the existing public card DTO in the CMS client.
- Do not expect status or audit metadata in the public variant-detail response.
- Do not expose full club entities or create recursive service-to-club-to-service client models.
- Do not infer whether a draft service, draft variant, wrong parent slug, or deleted resource exists from a public 404.
- Do not use truthiness checks for `clubIds`; distinguish `undefined` from `[]` explicitly.
