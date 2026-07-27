# Service media adoption: CMS and frontend handoff

## Status and compatibility rule

Service and service-variant fixed image slots now use explicit `MediaAsset`
relationships. Legacy URL columns remain in the database and API for the
transition and are deprecated in Swagger. For every slot, the render rule is:

```ts
const resolvedUrl = asset?.url ?? legacyUrl;
```

The nested asset wins even when both values are present. A null relation does
not filter the service/variant from internal or public queries because asset
relations use LEFT JOIN behavior. Already-assigned inactive assets remain
renderable; inactive status only prevents a new assignment.

## CMS request contract

Service create/update accepts:

```ts
type ServiceMediaWrite = {
  imageAssetId?: string | null;
  /** @deprecated fallback only */
  imageUrl?: string;
};
```

Service-variant create/update accepts:

```ts
type ServiceVariantMediaWrite = {
  imageAssetId?: string | null;
  bannerImageAssetId?: string | null;
  modelImageAssetId?: string | null;
  /** @deprecated fallback only */
  imageUrl?: string | null;
  /** @deprecated fallback only */
  bannerImageUrl?: string | null;
  /** @deprecated fallback only */
  modelImageUrl?: string | null;
};
```

On updates, omission preserves the relation and explicit `null` clears it. The
backend resolves IDs inside `ServicesService` through the shared media reference
validator. Missing/soft-deleted IDs return `404 MEDIA_ASSET.NOT_FOUND`;
non-images return `400 MEDIA_ASSET.NOT_IMAGE`; inactive images return
`400 MEDIA_ASSET.INACTIVE`. `usage` mismatch is advisory and does not block
assignment.

Upload once with `POST /media-assets/upload`, keep its returned `id`, and submit
that ID to the consuming slot. Do not add a service-specific upload endpoint and
do not use `MediaAsset.usage` to infer placement.

## Internal response contract

Each internal slot returns both its nullable ID and nullable summary:

```ts
type MediaAssetSummary = {
  id: string;
  name: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  isActive: boolean;
};

type ServiceMediaResponse = {
  imageAssetId: string | null;
  imageAsset: MediaAssetSummary | null;
  /** @deprecated fallback only */
  imageUrl: string | null;
};

type ServiceVariantMediaResponse = {
  imageAssetId: string | null;
  imageAsset: MediaAssetSummary | null;
  bannerImageAssetId: string | null;
  bannerImageAsset: MediaAssetSummary | null;
  modelImageAssetId: string | null;
  modelImageAsset: MediaAssetSummary | null;
  /** @deprecated fallback only */
  imageUrl: string | null;
  /** @deprecated fallback only */
  bannerImageUrl: string | null;
  /** @deprecated fallback only */
  modelImageUrl: string | null;
};
```

These fields are present on protected service detail/list and protected variant
detail/list responses. The CMS should render the nested summary directly and
must not perform a separate public media lookup.

## Public frontend contract

The public nested type contains exactly:

```ts
type PublicMediaAssetSummary = {
  id: string;
  url: string;
  altTextEn: string | null;
  altTextVi: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};
```

Public service list/detail responses return `imageAsset` and deprecated
`imageUrl`. Public variant-card responses return `imageAsset` and deprecated
`imageUrl`. Public variant detail additionally returns `bannerImageAsset` and
`modelImageAsset` with deprecated `bannerImageUrl` and `modelImageUrl`.

The frontend must apply the asset-first fallback independently per slot:

```ts
const cardUrl = response.imageAsset?.url ?? response.imageUrl;
const bannerUrl = response.bannerImageAsset?.url ?? response.bannerImageUrl;
const modelUrl = response.modelImageAsset?.url ?? response.modelImageUrl;
```

The fallback guarantee remains until CMS and frontend adoption plus production
import results are verified. This work does not authorize dropping any legacy
URL column.

## Import operations

Run and review the dry-run before apply. Relative frontend paths require actual
files through `--source-dir`; remote images pass bounded download and SSRF
validation. The command and report contract are documented in
`docs/SERVICE_MEDIA_IMPORT.md`. The current repository has no service-content
seed; only admin/permission seeds exist, so no transitional service fixture
requires conversion.
