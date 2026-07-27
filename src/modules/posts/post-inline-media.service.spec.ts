/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetType } from '../media-assets/enums/media-asset.enum';
import { PostInlineMediaAsset } from './entities/post-inline-media-asset.entity';
import { Post } from './entities/post.entity';
import { PostContentLocale } from './enums/post-content-locale.enum';
import { PostInlineMediaService } from './post-inline-media.service';

describe('PostInlineMediaService', () => {
  const post = { id: 'post-1' } as Post;
  const assetId = '5e8e7b84-56cb-4db1-82ba-33f1a740a9e1';
  let referenceRepository: {
    find: jest.Mock;
    delete: jest.Mock;
    insert: jest.Mock;
  };
  let assetRepository: { find: jest.Mock };
  let manager: EntityManager;
  let service: PostInlineMediaService;

  beforeEach(() => {
    referenceRepository = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    assetRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: assetId,
          type: MediaAssetType.IMAGE,
          isActive: true,
        },
      ]),
    };
    manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === PostInlineMediaAsset) return referenceRepository;
        if (entity === MediaAsset) return assetRepository;
        throw new Error('Unexpected repository');
      }),
    } as unknown as EntityManager;
    service = new PostInlineMediaService();
  });

  it('deduplicates repeated markers and replaces one locale transactionally', async () => {
    await service.synchronizeLocale(manager, post, PostContentLocale.EN, [
      assetId,
      assetId,
    ]);

    expect(referenceRepository.delete).toHaveBeenCalledWith({
      postId: post.id,
      locale: PostContentLocale.EN,
    });
    expect(referenceRepository.insert).toHaveBeenCalledWith([
      {
        postId: post.id,
        mediaAssetId: assetId,
        locale: PostContentLocale.EN,
      },
    ]);
  });

  it('removes stale references when the locale no longer contains markers', async () => {
    await service.synchronizeLocale(manager, post, PostContentLocale.VI, []);

    expect(referenceRepository.delete).toHaveBeenCalled();
    expect(referenceRepository.insert).not.toHaveBeenCalled();
  });

  it('allows the same asset to be referenced independently by both locales', async () => {
    await service.synchronizeLocale(manager, post, PostContentLocale.EN, [
      assetId,
    ]);
    await service.synchronizeLocale(manager, post, PostContentLocale.VI, [
      assetId,
    ]);

    expect(referenceRepository.insert).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ locale: PostContentLocale.EN }),
    ]);
    expect(referenceRepository.insert).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ locale: PostContentLocale.VI }),
    ]);
  });

  it('rejects missing, non-image, and newly inactive marker assets', async () => {
    assetRepository.find.mockResolvedValueOnce([]);
    await expect(
      service.synchronizeLocale(manager, post, PostContentLocale.EN, [assetId]),
    ).rejects.toBeInstanceOf(NotFoundException);

    assetRepository.find.mockResolvedValueOnce([
      { id: assetId, type: MediaAssetType.DOCUMENT, isActive: true },
    ]);
    await expect(
      service.synchronizeLocale(manager, post, PostContentLocale.EN, [assetId]),
    ).rejects.toBeInstanceOf(BadRequestException);

    assetRepository.find.mockResolvedValueOnce([
      { id: assetId, type: MediaAssetType.IMAGE, isActive: false },
    ]);
    await expect(
      service.synchronizeLocale(manager, post, PostContentLocale.EN, [assetId]),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'MEDIA_ASSET.INACTIVE' }),
    });
  });

  it('keeps an already-referenced asset when it later becomes inactive', async () => {
    referenceRepository.find.mockResolvedValueOnce([{ mediaAssetId: assetId }]);
    assetRepository.find.mockResolvedValueOnce([
      { id: assetId, type: MediaAssetType.IMAGE, isActive: false },
    ]);

    await expect(
      service.synchronizeLocale(manager, post, PostContentLocale.EN, [assetId]),
    ).resolves.toBeUndefined();
  });
});
