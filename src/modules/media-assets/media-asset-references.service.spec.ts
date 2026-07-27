/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';

import { Post } from '../posts/entities/post.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Club } from '../clubs/entities/club.entity';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { MediaAsset } from './entities/media-asset.entity';
import {
  MediaAssetReferenceSlot,
  MediaAssetSelectionWarningCode,
} from './enums/media-asset-reference.enum';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import { MediaAssetReferencesService } from './media-asset-references.service';

describe('MediaAssetReferencesService', () => {
  const assetId = '5e8e7b84-56cb-4db1-82ba-33f1a740a9e1';
  const activeImage = {
    id: assetId,
    type: MediaAssetType.IMAGE,
    usage: MediaAssetUsage.SERVICE,
    isActive: true,
  } as MediaAsset;

  let mediaAssetRepository: { findOne: jest.Mock; find: jest.Mock };
  let serviceRepository: { find: jest.Mock };
  let bannerRepository: { find: jest.Mock };
  let clubRepository: { find: jest.Mock };
  let clubGalleryRepository: { createQueryBuilder: jest.Mock };
  let clubGalleryQueryBuilder: typeof postInlineQueryBuilder;
  let facilityRepository: { find: jest.Mock };
  let membershipLevelRepository: { find: jest.Mock };
  let siteSettingRepository: { find: jest.Mock };
  let serviceVariantRepository: { find: jest.Mock };
  let postRepository: { find: jest.Mock };
  let postInlineQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    withDeleted: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getMany: jest.Mock;
  };
  let postInlineMediaRepository: { createQueryBuilder: jest.Mock };
  let referencesService: MediaAssetReferencesService;

  beforeEach(() => {
    mediaAssetRepository = {
      findOne: jest.fn().mockResolvedValue(activeImage),
      find: jest.fn().mockResolvedValue([activeImage]),
    };
    serviceRepository = { find: jest.fn().mockResolvedValue([]) };
    bannerRepository = { find: jest.fn().mockResolvedValue([]) };
    clubRepository = { find: jest.fn().mockResolvedValue([]) };
    facilityRepository = { find: jest.fn().mockResolvedValue([]) };
    membershipLevelRepository = { find: jest.fn().mockResolvedValue([]) };
    siteSettingRepository = { find: jest.fn().mockResolvedValue([]) };
    serviceVariantRepository = { find: jest.fn().mockResolvedValue([]) };
    postRepository = { find: jest.fn().mockResolvedValue([]) };
    postInlineQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    postInlineMediaRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(postInlineQueryBuilder),
    };
    clubGalleryQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    clubGalleryRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(clubGalleryQueryBuilder),
    };
    referencesService = new MediaAssetReferencesService(
      mediaAssetRepository as unknown as Repository<MediaAsset>,
      bannerRepository as unknown as Repository<Banner>,
      clubRepository as unknown as Repository<Club>,
      clubGalleryRepository as unknown as Repository<ClubGalleryMediaAsset>,
      facilityRepository as unknown as Repository<Facility>,
      membershipLevelRepository as unknown as Repository<MembershipLevel>,
      serviceRepository as unknown as Repository<Service>,
      serviceVariantRepository as unknown as Repository<ServiceVariant>,
      postRepository as unknown as Repository<Post>,
      postInlineMediaRepository as never,
      siteSettingRepository as unknown as Repository<SiteSetting>,
    );
  });

  it('accepts an active image and reports usage mismatch as a non-blocking warning', async () => {
    const result = await referencesService.validateImageSelection(assetId, {
      slot: MediaAssetReferenceSlot.POST_COVER_IMAGE,
      compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.POST],
    });

    expect(result.asset).toBe(activeImage);
    expect(result.warnings).toEqual([
      {
        code: MediaAssetSelectionWarningCode.USAGE_MISMATCH,
        slot: MediaAssetReferenceSlot.POST_COVER_IMAGE,
        assetUsage: MediaAssetUsage.SERVICE,
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.POST],
      },
    ]);
  });

  it('holds a read lock when selection participates in a consuming transaction', async () => {
    const manager = {
      getRepository: jest.fn().mockReturnValue(mediaAssetRepository),
    } as unknown as EntityManager;

    await referencesService.validateImageSelection(assetId, { manager });

    expect(mediaAssetRepository.findOne).toHaveBeenCalledWith({
      where: { id: assetId },
      lock: { mode: 'pessimistic_read' },
    });
  });

  it('validates multiple image selections in one repository query', async () => {
    const secondAsset = {
      ...activeImage,
      id: '899b4f62-b0cf-4e39-a3de-d82a6d31f182',
    };
    mediaAssetRepository.find.mockResolvedValue([activeImage, secondAsset]);

    const results = await referencesService.validateImageSelections(
      [activeImage.id, secondAsset.id],
      { compatibleUsages: [MediaAssetUsage.SERVICE] },
    );

    expect(results.map(({ asset }) => asset?.id)).toEqual([
      activeImage.id,
      secondAsset.id,
    ]);
    expect(mediaAssetRepository.find).toHaveBeenCalledTimes(1);
    expect(mediaAssetRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: expect.objectContaining({ _type: 'in' }),
        },
      }),
    );
  });

  it('rejects missing, soft-deleted, non-image, and inactive selections', async () => {
    mediaAssetRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      referencesService.validateImageSelection(assetId),
    ).rejects.toBeInstanceOf(NotFoundException);

    mediaAssetRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      referencesService.validateImageSelection(assetId),
    ).rejects.toBeInstanceOf(NotFoundException);

    mediaAssetRepository.findOne.mockResolvedValueOnce({
      ...activeImage,
      type: MediaAssetType.DOCUMENT,
    });
    await expect(
      referencesService.validateImageSelection(assetId),
    ).rejects.toBeInstanceOf(BadRequestException);

    mediaAssetRepository.findOne.mockResolvedValueOnce({
      ...activeImage,
      isActive: false,
    });
    await expect(
      referencesService.validateImageSelection(assetId),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'MEDIA_ASSET.INACTIVE' }),
    });
  });

  it('reports stable references across every relational media slot', async () => {
    bannerRepository.find.mockResolvedValue([
      {
        id: 'banner-1',
        titleEn: 'Hero',
        imageAssetId: assetId,
        mobileImageAssetId: assetId,
      },
    ]);
    clubRepository.find.mockResolvedValue([
      {
        id: 'club-1',
        nameEn: 'District 1',
        coverImageAssetId: assetId,
      },
    ]);
    clubGalleryQueryBuilder.getMany.mockResolvedValue([
      {
        id: 'gallery-1',
        clubId: 'club-1',
        mediaAssetId: assetId,
        displayOrder: 0,
        club: { nameEn: 'District 1' },
      },
    ]);
    facilityRepository.find.mockResolvedValue([
      {
        id: 'facility-1',
        nameEn: 'Sauna',
        coverImageAssetId: assetId,
      },
    ]);
    membershipLevelRepository.find.mockResolvedValue([
      {
        id: 'level-1',
        nameEn: 'Gold',
        imageAssetId: assetId,
      },
    ]);
    siteSettingRepository.find.mockResolvedValue([
      {
        id: 'setting-1',
        key: 'forms.background',
        labelEn: 'Form background',
        mediaAssetId: assetId,
      },
    ]);
    serviceRepository.find.mockResolvedValue([
      {
        id: 'service-1',
        nameEn: 'Group Classes',
        nameVi: 'Lop nhom',
        imageAssetId: assetId,
      },
    ]);
    serviceVariantRepository.find.mockResolvedValue([
      {
        id: 'variant-1',
        nameEn: 'Strength',
        nameVi: 'Suc manh',
        imageAssetId: assetId,
        bannerImageAssetId: assetId,
        modelImageAssetId: assetId,
      },
    ]);
    postRepository.find.mockResolvedValue([
      {
        id: 'post-1',
        titleEn: 'Training guide',
        titleVi: 'Huong dan',
        coverImageAssetId: assetId,
      },
    ]);
    postInlineQueryBuilder.getMany.mockResolvedValue([
      {
        postId: 'post-1',
        mediaAssetId: assetId,
        locale: 'vi',
        post: {
          id: 'post-1',
          titleEn: 'Training guide',
          titleVi: 'Huong dan',
        },
      },
    ]);

    const report = await referencesService.getUsageReport(assetId);

    expect(report).toEqual({
      assetId,
      canDelete: false,
      totalReferences: 13,
      references: expect.arrayContaining([
        expect.objectContaining({
          entityType: 'banner',
          slot: 'banner.mobile_image',
          field: 'mobileImageAssetId',
        }),
        expect.objectContaining({
          entityType: 'club',
          slot: 'club.gallery_image',
          field: 'galleryMedia',
        }),
        expect.objectContaining({
          entityType: 'facility',
          slot: 'facility.cover_image',
          field: 'coverImageAssetId',
        }),
        expect.objectContaining({
          entityType: 'membership_level',
          slot: 'membership_level.image',
          field: 'imageAssetId',
        }),
        expect.objectContaining({
          entityType: 'service',
          entityId: 'service-1',
          entityName: 'Group Classes',
          slot: 'service.image',
          field: 'imageAssetId',
        }),
        expect.objectContaining({
          entityType: 'service_variant',
          slot: 'service_variant.banner_image',
          field: 'bannerImageAssetId',
        }),
        expect.objectContaining({
          entityType: 'post',
          slot: 'post.cover_image',
          field: 'coverImageAssetId',
        }),
        expect.objectContaining({
          entityType: 'site_setting',
          slot: 'site_setting.media_asset',
          field: 'mediaAssetId',
        }),
        expect.objectContaining({
          entityType: 'post',
          slot: 'post.inline_content_image',
          field: 'contentHtmlVi',
          locale: 'vi',
        }),
      ]),
    });
    expect(serviceRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(serviceVariantRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(postRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(postInlineQueryBuilder.withDeleted).toHaveBeenCalled();
  });
});
