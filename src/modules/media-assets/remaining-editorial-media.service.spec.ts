/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import type { EntityManager, Repository } from 'typeorm';

import { BannersService } from '../banners/banners.service';
import { Banner } from '../banners/entities/banner.entity';
import {
  BannerLinkTarget,
  BannerPlacement,
  BannerStatus,
} from '../banners/enums/banner.enum';
import { ClubsService } from '../clubs/clubs.service';
import type { ClubGalleryMediaInputDto } from '../clubs/dtos/club-gallery-media.dto';
import { Club } from '../clubs/entities/club.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetReferencesService } from './media-asset-references.service';

describe('remaining editorial media service semantics', () => {
  const currentUser = {
    id: 'user-1',
    username: 'admin',
    role: { id: 'role-1', name: 'admin' },
    permissions: [],
  };
  const user = { id: currentUser.id } as User;
  const oldAsset = {
    id: 'asset-old',
    name: 'Old banner',
    url: '/legacy/old-banner.jpg',
    isActive: true,
  } as MediaAsset;

  it('preserves a fixed slot when omitted and clears it only on explicit null', async () => {
    const banner = {
      id: 'banner-1',
      placement: BannerPlacement.HOMEPAGE_CAROUSEL,
      imageUrl: '/legacy/banner.jpg',
      imageAssetId: oldAsset.id,
      imageAsset: oldAsset,
      mobileImageAssetId: null,
      mobileImageAsset: null,
      linkTarget: BannerLinkTarget.SELF,
      status: BannerStatus.DRAFT,
      displayOrder: 0,
      createdAt: new Date('2026-07-17T00:00:00.000Z'),
      updatedAt: new Date('2026-07-17T00:00:00.000Z'),
    } as Banner;
    const save = jest.fn().mockImplementation((entity) => entity);
    const manager = {
      getRepository: jest.fn().mockReturnValue({ save }),
    } as unknown as EntityManager;
    const bannerRepository = {
      manager: {
        transaction: jest.fn(
          async (callback: (value: EntityManager) => Promise<void>) =>
            callback(manager),
        ),
      },
      findOne: jest.fn().mockResolvedValue(banner),
    } as unknown as Repository<Banner>;
    const mediaReferences = {
      validateImageSelection: jest
        .fn()
        .mockResolvedValue({ asset: null, warnings: [] }),
    } as unknown as MediaAssetReferencesService;
    const service = new BannersService(
      {
        findOne: jest.fn().mockResolvedValue(user),
      } as unknown as Repository<User>,
      bannerRepository,
      mediaReferences,
    );

    await service.update(banner.id, {}, currentUser);
    expect(mediaReferences.validateImageSelection).not.toHaveBeenCalled();
    expect(banner.imageAsset).toBe(oldAsset);

    await service.update(banner.id, { imageAssetId: null }, currentUser);
    expect(mediaReferences.validateImageSelection).toHaveBeenCalledWith(null, {
      manager,
      slot: 'banner.image',
      compatibleUsages: ['general', 'banner'],
    });
    expect(banner.imageAsset).toBeNull();
  });

  it('rejects non-consecutive gallery ordering before validating assets', async () => {
    const mediaReferences = {
      validateImageSelections: jest.fn(),
    } as unknown as MediaAssetReferencesService;
    const service = new ClubsService(
      {} as Repository<User>,
      {} as Repository<Club>,
      {} as Repository<Facility>,
      {} as Repository<Service>,
      mediaReferences,
    );
    const internal = service as unknown as {
      validateGalleryMedia(
        items: ClubGalleryMediaInputDto[],
        manager: EntityManager,
      ): Promise<unknown>;
    };

    await expect(
      internal.validateGalleryMedia(
        [
          {
            mediaAssetId: '2a446e27-e55b-43d1-87d8-4e01f1f75043',
            displayOrder: 1,
          },
        ],
        {} as EntityManager,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CLUB.GALLERY_ORDER_INVALID' }),
    });
    expect(mediaReferences.validateImageSelections).not.toHaveBeenCalled();
  });

  it('validates an ordered gallery in one batch', async () => {
    const assets = [{ id: 'asset-1' }, { id: 'asset-2' }] as MediaAsset[];
    const validateImageSelections = jest
      .fn()
      .mockResolvedValue(assets.map((asset) => ({ asset, warnings: [] })));
    const mediaReferences = {
      validateImageSelections,
    } as unknown as MediaAssetReferencesService;
    const service = new ClubsService(
      {} as Repository<User>,
      {} as Repository<Club>,
      {} as Repository<Facility>,
      {} as Repository<Service>,
      mediaReferences,
    );
    const internal = service as unknown as {
      validateGalleryMedia(
        items: ClubGalleryMediaInputDto[],
        manager: EntityManager,
      ): Promise<Array<{ mediaAsset: MediaAsset; displayOrder: number }>>;
    };
    const manager = {} as EntityManager;
    const items = [
      { mediaAssetId: 'asset-1', displayOrder: 0 },
      { mediaAssetId: 'asset-2', displayOrder: 1 },
    ];

    await expect(
      internal.validateGalleryMedia(items, manager),
    ).resolves.toEqual([
      { mediaAsset: assets[0], displayOrder: 0 },
      { mediaAsset: assets[1], displayOrder: 1 },
    ]);
    expect(validateImageSelections).toHaveBeenCalledTimes(1);
    expect(validateImageSelections).toHaveBeenCalledWith(
      ['asset-1', 'asset-2'],
      expect.objectContaining({ manager, slot: 'club.gallery_image' }),
    );
  });
});
