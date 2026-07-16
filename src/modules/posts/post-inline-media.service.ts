import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable } from '@nestjs/common';
import { In, type EntityManager } from 'typeorm';
import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetType } from '../media-assets/enums/media-asset.enum';
import { PostInlineMediaAsset } from './entities/post-inline-media-asset.entity';
import { Post } from './entities/post.entity';
import { PostContentLocale } from './enums/post-content-locale.enum';

@Injectable()
export class PostInlineMediaService {
  async synchronizeLocale(
    manager: EntityManager,
    post: Post,
    locale: PostContentLocale,
    mediaAssetIds: readonly string[],
  ): Promise<void> {
    const referenceRepository = manager.getRepository(PostInlineMediaAsset);
    const existingReferences = await referenceRepository.find({
      select: { mediaAssetId: true },
      where: { postId: post.id, locale },
    });
    const existingIds = new Set(
      existingReferences.map((reference) => reference.mediaAssetId),
    );
    const requestedIds = [...new Set(mediaAssetIds)];

    const assets =
      requestedIds.length === 0
        ? []
        : await manager.getRepository(MediaAsset).find({
            where: { id: In(requestedIds) },
            lock: { mode: 'pessimistic_read' },
          });
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

    for (const assetId of requestedIds) {
      const asset = assetsById.get(assetId);
      if (!asset) {
        throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
      }
      if (asset.type !== MediaAssetType.IMAGE) {
        throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_NOT_IMAGE);
      }
      if (!asset.isActive && !existingIds.has(assetId)) {
        throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_INACTIVE);
      }
    }

    await referenceRepository.delete({ postId: post.id, locale });

    if (requestedIds.length > 0) {
      await referenceRepository.insert(
        requestedIds.map((mediaAssetId) => ({
          postId: post.id,
          mediaAssetId,
          locale,
        })),
      );
    }
  }
}
