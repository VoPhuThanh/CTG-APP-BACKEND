/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Banner } from '../banners/entities/banner.entity';
import { mapBannerToPublicResponse } from '../banners/banners.mapper';
import {
  mapClubToPublicListResponse,
  mapClubToPublicResponse,
  mapClubToResponse,
} from '../clubs/clubs.mapper';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Club } from '../clubs/entities/club.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { mapFacilityToPublicResponse } from '../facilities/facilities.mapper';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { mapMembershipLevelToPublicResponse } from '../memberships/memberships.mapper';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { SiteSettingValueType } from '../site-settings/enums/site-setting.enum';
import {
  mapSiteSettingToPublicResponse,
  mapSiteSettingToResponse,
} from '../site-settings/site-settings.mapper';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';

describe('remaining editorial media mappers', () => {
  const createdAt = new Date('2026-07-17T00:00:00.000Z');
  const asset = {
    id: 'asset-1',
    name: 'Editorial image',
    url: '/uploads/media/editorial.webp',
    storageProvider: null,
    storageKey: null,
    bucket: null,
    altTextEn: 'Editorial image',
    altTextVi: null,
    width: 1600,
    height: 900,
    mimeType: 'image/webp',
    type: MediaAssetType.IMAGE,
    usage: MediaAssetUsage.GENERAL,
    isActive: false,
  } as unknown as MediaAsset;

  it('returns null summaries for legacy records without assigned media', () => {
    const banner = {
      id: 'banner-1',
      placement: 'homepage_carousel',
      titleEn: null,
      titleVi: null,
      subtitleEn: null,
      subtitleVi: null,
      imageUrl: '/legacy/banner.jpg',
      imageAssetId: null,
      imageAsset: null,
      mobileImageUrl: null,
      mobileImageAssetId: null,
      mobileImageAsset: null,
      linkUrlEn: null,
      linkUrlVi: null,
      linkTarget: 'self',
    } as unknown as Banner;

    expect(mapBannerToPublicResponse(banner)).toEqual(
      expect.objectContaining({
        imageUrl: '/legacy/banner.jpg',
        imageAsset: null,
        mobileImageAsset: null,
      }),
    );
  });

  it('keeps public club lists light and returns deterministically ordered gallery summaries on detail', () => {
    const gallery = [
      {
        id: 'gallery-2',
        mediaAssetId: 'asset-2',
        displayOrder: 1,
        mediaAsset: { ...asset, id: 'asset-2', url: '/media/second.webp' },
      },
      {
        id: 'gallery-1',
        mediaAssetId: asset.id,
        displayOrder: 0,
        mediaAsset: asset,
      },
    ] as unknown as ClubGalleryMediaAsset[];
    const club = {
      id: 'club-1',
      nameEn: 'District 1',
      nameVi: 'Quan 1',
      slug: 'district-1',
      addressEn: 'Address',
      addressVi: 'Dia chi',
      phoneNumbers: [],
      coverImageUrl: '/legacy/club.jpg',
      coverImageAssetId: asset.id,
      coverImageAsset: asset,
      galleryImageUrls: ['/legacy/gallery.jpg'],
      galleryMedia: gallery,
      status: 'published',
      displayOrder: 0,
      isFeatured: true,
      facilities: [],
      services: [],
      createdAt,
      updatedAt: createdAt,
    } as unknown as Club;

    const list = mapClubToPublicListResponse(club);
    const detail = mapClubToPublicResponse(club);
    const internal = mapClubToResponse(club);

    expect('galleryMedia' in list).toBe(false);
    expect(detail.galleryMedia.map((item) => item.id)).toEqual([
      'gallery-1',
      'gallery-2',
    ]);
    expect(internal.galleryMedia[0]).toEqual(
      expect.objectContaining({
        mediaAssetId: asset.id,
        mediaAsset: expect.objectContaining({
          name: asset.name,
          isActive: false,
        }),
      }),
    );
    expect(detail.coverImageAsset?.url ?? detail.coverImageUrl).toBe(asset.url);
  });

  it('maps render-ready summaries for facilities, membership levels, and asset-valued settings', () => {
    const facility = {
      id: 'facility-1',
      nameEn: 'Sauna',
      nameVi: 'Phong xong hoi',
      slug: 'sauna',
      coverImageUrl: null,
      coverImageAsset: asset,
      displayOrder: 0,
    } as unknown as Facility;
    const level = {
      id: 'level-1',
      nameEn: 'Gold',
      nameVi: 'Gold',
      slug: 'gold',
      imageUrl: null,
      imageAsset: asset,
      isFeatured: true,
      displayOrder: 0,
      plans: [],
      benefits: [],
    } as unknown as MembershipLevel;
    const setting = {
      id: 'setting-1',
      key: 'forms.background',
      group: 'forms',
      labelEn: 'Form background',
      value: null,
      valueType: SiteSettingValueType.MEDIA_ASSET,
      mediaAssetId: asset.id,
      mediaAsset: asset,
      isPublic: true,
      isEditable: true,
      displayOrder: 0,
      createdAt,
      updatedAt: createdAt,
    } as unknown as SiteSetting;

    expect(mapFacilityToPublicResponse(facility).coverImageAsset).toEqual(
      expect.objectContaining({ id: asset.id, url: asset.url }),
    );
    expect(mapMembershipLevelToPublicResponse(level).imageAsset).toEqual(
      expect.objectContaining({ id: asset.id, url: asset.url }),
    );
    expect(mapSiteSettingToPublicResponse(setting)).toEqual(
      expect.objectContaining({
        value: null,
        valueType: SiteSettingValueType.MEDIA_ASSET,
        mediaAssetId: asset.id,
        mediaAsset: expect.objectContaining({ url: asset.url }),
      }),
    );
    expect(mapSiteSettingToResponse(setting).mediaAsset).toEqual(
      expect.objectContaining({ name: asset.name, isActive: false }),
    );
  });
});
