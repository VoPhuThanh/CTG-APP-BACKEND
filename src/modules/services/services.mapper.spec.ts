import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import {
  MediaAssetType,
  MediaAssetUsage,
} from '../media-assets/enums/media-asset.enum';
import { Service } from './entities/service.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { ServiceStatus } from './enums/service.enum';
import {
  mapServiceToPublicResponse,
  mapServiceVariantToPublicDetailResponse,
} from './services.mapper';

describe('services mapper media lifecycle', () => {
  it('keeps an already-assigned inactive image renderable on a published service', () => {
    const imageAsset = {
      id: 'asset-1',
      name: 'Service card',
      url: '/uploads/media/service-card.png',
      type: MediaAssetType.IMAGE,
      usage: MediaAssetUsage.SERVICE,
      isActive: false,
      altTextEn: 'Group training',
      altTextVi: null,
      width: 1200,
      height: 800,
      mimeType: 'image/png',
    } as unknown as MediaAsset;
    const service = {
      id: 'service-1',
      nameEn: 'Group Classes',
      nameVi: 'Lop nhom',
      slug: 'group-classes',
      imageAssetId: imageAsset.id,
      imageAsset,
      status: ServiceStatus.PUBLISHED,
      displayOrder: 1,
      isFeatured: true,
      variants: [],
    } as unknown as Service;

    expect(mapServiceToPublicResponse(service).imageAsset).toEqual({
      id: imageAsset.id,
      url: imageAsset.url,
      altTextEn: imageAsset.altTextEn,
      altTextVi: null,
      width: 1200,
      height: 800,
      mimeType: 'image/png',
    });
  });

  it('preserves the deprecated URL as fallback when the relation is null', () => {
    const legacyUrl = '/images/services/group-classes.jpg';
    const service = {
      id: 'service-1',
      nameEn: 'Group Classes',
      nameVi: 'Lop nhom',
      slug: 'group-classes',
      imageUrl: legacyUrl,
      imageAssetId: null,
      imageAsset: null,
      status: ServiceStatus.PUBLISHED,
      displayOrder: 1,
      isFeatured: false,
      variants: [],
    } as unknown as Service;

    const response = mapServiceToPublicResponse(service);

    expect(response.imageAsset).toBeNull();
    expect(response.imageUrl).toBe(legacyUrl);
    expect(response.imageAsset?.url ?? response.imageUrl).toBe(legacyUrl);
  });

  it('makes the related asset URL win while retaining legacy detail fallbacks', () => {
    const imageAsset = {
      id: 'asset-1',
      url: '/uploads/media/new-card.png',
      altTextEn: null,
      altTextVi: null,
      width: 1,
      height: 1,
      mimeType: 'image/png',
    } as unknown as MediaAsset;
    const variant = {
      id: 'variant-1',
      service: {
        id: 'service-1',
        nameEn: 'Group Classes',
        nameVi: 'Lop nhom',
        slug: 'group-classes',
      },
      nameEn: 'Strength',
      nameVi: 'Suc manh',
      slug: 'strength',
      imageUrl: '/images/legacy-card.png',
      imageAsset,
      bannerImageUrl: '/images/legacy-banner.png',
      bannerImageAsset: null,
      modelImageUrl: null,
      modelImageAsset: null,
      skillLevel: 'beginner',
      displayOrder: 1,
      isFeatured: false,
      clubs: [],
    } as unknown as ServiceVariant;

    const response = mapServiceVariantToPublicDetailResponse(variant);

    expect(response.imageAsset?.url ?? response.imageUrl).toBe(imageAsset.url);
    expect(response.bannerImageAsset?.url ?? response.bannerImageUrl).toBe(
      '/images/legacy-banner.png',
    );
    expect(response.modelImageAsset?.url ?? response.modelImageUrl).toBeNull();
  });

  it('keeps managed card, banner, and model assets in nested public variants', () => {
    const imageAsset = {
      id: 'asset-card',
      url: '/uploads/media/card.png',
      altTextEn: 'Card',
      altTextVi: 'The',
      width: 800,
      height: 600,
      mimeType: 'image/png',
    } as MediaAsset;
    const bannerImageAsset = {
      ...imageAsset,
      id: 'asset-banner',
      url: '/uploads/media/banner.png',
    } as MediaAsset;
    const modelImageAsset = {
      ...imageAsset,
      id: 'asset-model',
      url: '/uploads/media/model.png',
    } as MediaAsset;
    const parent = {
      id: 'service-1',
      nameEn: 'Group Classes',
      nameVi: 'Lop nhom',
      slug: 'group-classes',
      displayOrder: 1,
      isFeatured: false,
      variants: [
        {
          id: 'variant-1',
          service: { id: 'service-1' },
          nameEn: 'Strength',
          nameVi: 'Suc manh',
          slug: 'strength',
          imageAsset,
          bannerImageAsset,
          modelImageAsset,
          skillLevel: 'beginner',
          displayOrder: 1,
          isFeatured: false,
          clubs: [],
        },
      ],
    } as unknown as Service;

    const [variant] = mapServiceToPublicResponse(parent).variants;

    expect(variant.imageAsset?.id).toBe(imageAsset.id);
    expect(variant.bannerImageAsset?.id).toBe(bannerImageAsset.id);
    expect(variant.modelImageAsset?.id).toBe(modelImageAsset.id);
  });

  it('uses the parent service ID when an inverse variant service is not hydrated', () => {
    const parent = {
      id: 'service-1',
      nameEn: 'Group Classes',
      nameVi: 'Lop nhom',
      slug: 'group-classes',
      displayOrder: 1,
      isFeatured: false,
      variants: [
        {
          id: 'variant-1',
          nameEn: 'Strength',
          nameVi: 'Suc manh',
          slug: 'strength',
          skillLevel: 'beginner',
          displayOrder: 1,
          isFeatured: false,
          clubs: [],
        },
      ],
    } as unknown as Service;

    expect(mapServiceToPublicResponse(parent).variants[0].serviceId).toBe(
      parent.id,
    );
  });
});
