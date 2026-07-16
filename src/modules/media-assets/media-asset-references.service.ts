import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import { Post } from '../posts/entities/post.entity';
import { PostInlineMediaAsset } from '../posts/entities/post-inline-media-asset.entity';
import { PostContentLocale } from '../posts/enums/post-content-locale.enum';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import type {
  MediaAssetReferenceResponseDto,
  MediaAssetUsageReportResponseDto,
} from './dtos/media-asset-usage.dto';
import { MediaAsset } from './entities/media-asset.entity';
import {
  MediaAssetReferenceEntityType,
  MediaAssetReferenceSlot,
  MediaAssetSelectionWarningCode,
} from './enums/media-asset-reference.enum';
import { MediaAssetType } from './enums/media-asset.enum';
import type {
  MediaAssetImageSelectionValidationResult,
  ValidateMediaAssetImageSelectionOptions,
} from './interfaces/media-asset-reference.interface';

@Injectable()
export class MediaAssetReferencesService {
  private readonly logger = new Logger(MediaAssetReferencesService.name);

  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceVariant)
    private readonly serviceVariantRepository: Repository<ServiceVariant>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostInlineMediaAsset)
    private readonly postInlineMediaRepository: Repository<PostInlineMediaAsset>,
  ) {}

  async validateImageSelection(
    assetId: string | null | undefined,
    options: ValidateMediaAssetImageSelectionOptions = {},
  ): Promise<MediaAssetImageSelectionValidationResult> {
    if (!assetId) {
      return { asset: null, warnings: [] };
    }

    const repository = options.manager
      ? options.manager.getRepository(MediaAsset)
      : this.mediaAssetRepository;
    const asset = await repository.findOne({
      where: { id: assetId },
      ...(options.manager
        ? { lock: { mode: 'pessimistic_read' as const } }
        : {}),
    });

    if (!asset) {
      throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
    }

    if (asset.type !== MediaAssetType.IMAGE) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_NOT_IMAGE);
    }

    if (!asset.isActive) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_INACTIVE);
    }

    const compatibleUsages = [...(options.compatibleUsages ?? [])];
    const warnings =
      compatibleUsages.length > 0 && !compatibleUsages.includes(asset.usage)
        ? [
            {
              code: MediaAssetSelectionWarningCode.USAGE_MISMATCH,
              slot: options.slot ?? null,
              assetUsage: asset.usage,
              compatibleUsages,
            },
          ]
        : [];

    if (warnings.length > 0) {
      this.logger.warn(
        `Media asset ${asset.id} usage ${asset.usage} does not match slot ${options.slot ?? 'unspecified'}; assignment remains allowed.`,
      );
    }

    return { asset, warnings };
  }

  async getUsageReport(
    assetId: string,
    manager?: EntityManager,
  ): Promise<MediaAssetUsageReportResponseDto> {
    const assetRepository = manager
      ? manager.getRepository(MediaAsset)
      : this.mediaAssetRepository;
    const asset = await assetRepository.findOne({ where: { id: assetId } });

    if (!asset) {
      throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
    }

    const references = await this.findUsageReferences(assetId, manager);

    return {
      assetId,
      canDelete: references.length === 0,
      totalReferences: references.length,
      references,
    };
  }

  async findUsageReferences(
    assetId: string,
    manager?: EntityManager,
  ): Promise<MediaAssetReferenceResponseDto[]> {
    const serviceRepository = manager
      ? manager.getRepository(Service)
      : this.serviceRepository;
    const variantRepository = manager
      ? manager.getRepository(ServiceVariant)
      : this.serviceVariantRepository;
    const postRepository = manager
      ? manager.getRepository(Post)
      : this.postRepository;
    const postInlineMediaRepository = manager
      ? manager.getRepository(PostInlineMediaAsset)
      : this.postInlineMediaRepository;

    const [services, variants, posts, inlineReferences] = await Promise.all([
      serviceRepository.find({
        select: { id: true, nameEn: true, nameVi: true, imageAssetId: true },
        where: { imageAssetId: assetId },
        withDeleted: true,
      }),
      variantRepository.find({
        select: {
          id: true,
          nameEn: true,
          nameVi: true,
          imageAssetId: true,
          bannerImageAssetId: true,
          modelImageAssetId: true,
        },
        where: [
          { imageAssetId: assetId },
          { bannerImageAssetId: assetId },
          { modelImageAssetId: assetId },
        ],
        withDeleted: true,
      }),
      postRepository.find({
        select: {
          id: true,
          titleEn: true,
          titleVi: true,
          coverImageAssetId: true,
        },
        where: { coverImageAssetId: assetId },
        withDeleted: true,
      }),
      postInlineMediaRepository
        .createQueryBuilder('inlineReference')
        .leftJoinAndSelect('inlineReference.post', 'inlinePost')
        .withDeleted()
        .where('inlineReference.mediaAssetId = :assetId', { assetId })
        .orderBy('inlineReference.locale', 'ASC')
        .addOrderBy('inlineReference.postId', 'ASC')
        .getMany(),
    ]);

    const references: MediaAssetReferenceResponseDto[] = [];

    for (const service of services) {
      references.push({
        entityType: MediaAssetReferenceEntityType.SERVICE,
        entityId: service.id,
        entityName: service.nameEn || service.nameVi || null,
        slot: MediaAssetReferenceSlot.SERVICE_IMAGE,
        field: 'imageAssetId',
      });
    }

    for (const variant of variants) {
      const common = {
        entityType: MediaAssetReferenceEntityType.SERVICE_VARIANT,
        entityId: variant.id,
        entityName: variant.nameEn || variant.nameVi || null,
      };

      if (variant.imageAssetId === assetId) {
        references.push({
          ...common,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_IMAGE,
          field: 'imageAssetId',
        });
      }
      if (variant.bannerImageAssetId === assetId) {
        references.push({
          ...common,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_BANNER_IMAGE,
          field: 'bannerImageAssetId',
        });
      }
      if (variant.modelImageAssetId === assetId) {
        references.push({
          ...common,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_MODEL_IMAGE,
          field: 'modelImageAssetId',
        });
      }
    }

    for (const post of posts) {
      references.push({
        entityType: MediaAssetReferenceEntityType.POST,
        entityId: post.id,
        entityName: post.titleEn || post.titleVi || null,
        slot: MediaAssetReferenceSlot.POST_COVER_IMAGE,
        field: 'coverImageAssetId',
      });
    }

    for (const reference of inlineReferences) {
      references.push({
        entityType: MediaAssetReferenceEntityType.POST,
        entityId: reference.postId,
        entityName: reference.post?.titleEn || reference.post?.titleVi || null,
        slot: MediaAssetReferenceSlot.POST_INLINE_CONTENT_IMAGE,
        field:
          reference.locale === PostContentLocale.EN
            ? 'contentHtmlEn'
            : 'contentHtmlVi',
        locale: reference.locale,
      });
    }

    return references.sort((left, right) =>
      `${left.entityType}:${left.entityId}:${left.slot}:${left.locale ?? ''}`.localeCompare(
        `${right.entityType}:${right.entityId}:${right.slot}:${right.locale ?? ''}`,
      ),
    );
  }
}
