import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type EntityManager, type Repository } from 'typeorm';

import { Post } from '../posts/entities/post.entity';
import { PostInlineMediaAsset } from '../posts/entities/post-inline-media-asset.entity';
import { PostContentLocale } from '../posts/enums/post-content-locale.enum';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Club } from '../clubs/entities/club.entity';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
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

    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,

    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,

    @InjectRepository(ClubGalleryMediaAsset)
    private readonly clubGalleryRepository: Repository<ClubGalleryMediaAsset>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(MembershipLevel)
    private readonly membershipLevelRepository: Repository<MembershipLevel>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceVariant)
    private readonly serviceVariantRepository: Repository<ServiceVariant>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostInlineMediaAsset)
    private readonly postInlineMediaRepository: Repository<PostInlineMediaAsset>,

    @InjectRepository(SiteSetting)
    private readonly siteSettingRepository: Repository<SiteSetting>,
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

    return this.validateResolvedImageAsset(asset, options);
  }

  async validateImageSelections(
    assetIds: readonly string[],
    options: ValidateMediaAssetImageSelectionOptions = {},
  ): Promise<MediaAssetImageSelectionValidationResult[]> {
    if (assetIds.length === 0) return [];

    const repository = options.manager
      ? options.manager.getRepository(MediaAsset)
      : this.mediaAssetRepository;
    const uniqueAssetIds = [...new Set(assetIds)];
    const assets = await repository.find({
      where: { id: In(uniqueAssetIds) },
      ...(options.manager
        ? { lock: { mode: 'pessimistic_read' as const } }
        : {}),
    });
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

    return assetIds.map((assetId) =>
      this.validateResolvedImageAsset(assetsById.get(assetId) ?? null, options),
    );
  }

  private validateResolvedImageAsset(
    asset: MediaAsset | null,
    options: ValidateMediaAssetImageSelectionOptions,
  ): MediaAssetImageSelectionValidationResult {
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
    const bannerRepository = manager
      ? manager.getRepository(Banner)
      : this.bannerRepository;
    const clubRepository = manager
      ? manager.getRepository(Club)
      : this.clubRepository;
    const clubGalleryRepository = manager
      ? manager.getRepository(ClubGalleryMediaAsset)
      : this.clubGalleryRepository;
    const facilityRepository = manager
      ? manager.getRepository(Facility)
      : this.facilityRepository;
    const membershipLevelRepository = manager
      ? manager.getRepository(MembershipLevel)
      : this.membershipLevelRepository;
    const siteSettingRepository = manager
      ? manager.getRepository(SiteSetting)
      : this.siteSettingRepository;
    const variantRepository = manager
      ? manager.getRepository(ServiceVariant)
      : this.serviceVariantRepository;
    const postRepository = manager
      ? manager.getRepository(Post)
      : this.postRepository;
    const postInlineMediaRepository = manager
      ? manager.getRepository(PostInlineMediaAsset)
      : this.postInlineMediaRepository;

    const [
      banners,
      clubs,
      clubGalleryItems,
      facilities,
      membershipLevels,
      services,
      variants,
      posts,
      inlineReferences,
      siteSettings,
    ] = await Promise.all([
      bannerRepository.find({
        select: {
          id: true,
          titleEn: true,
          titleVi: true,
          imageAssetId: true,
          mobileImageAssetId: true,
        },
        where: [{ imageAssetId: assetId }, { mobileImageAssetId: assetId }],
        withDeleted: true,
      }),
      clubRepository.find({
        select: {
          id: true,
          nameEn: true,
          nameVi: true,
          coverImageAssetId: true,
        },
        where: { coverImageAssetId: assetId },
        withDeleted: true,
      }),
      clubGalleryRepository
        .createQueryBuilder('galleryItem')
        .leftJoinAndSelect('galleryItem.club', 'galleryClub')
        .withDeleted()
        .where('galleryItem.mediaAssetId = :assetId', { assetId })
        .orderBy('galleryItem.displayOrder', 'ASC')
        .addOrderBy('galleryItem.id', 'ASC')
        .getMany(),
      facilityRepository.find({
        select: {
          id: true,
          nameEn: true,
          nameVi: true,
          coverImageAssetId: true,
        },
        where: { coverImageAssetId: assetId },
        withDeleted: true,
      }),
      membershipLevelRepository.find({
        select: {
          id: true,
          nameEn: true,
          nameVi: true,
          imageAssetId: true,
        },
        where: { imageAssetId: assetId },
        withDeleted: true,
      }),
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
      siteSettingRepository.find({
        select: {
          id: true,
          key: true,
          labelEn: true,
          mediaAssetId: true,
        },
        where: { mediaAssetId: assetId },
        withDeleted: true,
      }),
    ]);

    const references: MediaAssetReferenceResponseDto[] = [];

    for (const banner of banners) {
      const common = {
        entityType: MediaAssetReferenceEntityType.BANNER,
        entityId: banner.id,
        entityName: banner.titleEn || banner.titleVi || null,
      };
      if (banner.imageAssetId === assetId) {
        references.push({
          ...common,
          slot: MediaAssetReferenceSlot.BANNER_IMAGE,
          field: 'imageAssetId',
        });
      }
      if (banner.mobileImageAssetId === assetId) {
        references.push({
          ...common,
          slot: MediaAssetReferenceSlot.BANNER_MOBILE_IMAGE,
          field: 'mobileImageAssetId',
        });
      }
    }

    for (const club of clubs) {
      references.push({
        entityType: MediaAssetReferenceEntityType.CLUB,
        entityId: club.id,
        entityName: club.nameEn || club.nameVi || null,
        slot: MediaAssetReferenceSlot.CLUB_COVER_IMAGE,
        field: 'coverImageAssetId',
      });
    }

    for (const galleryItem of clubGalleryItems) {
      references.push({
        entityType: MediaAssetReferenceEntityType.CLUB,
        entityId: galleryItem.clubId,
        entityName:
          galleryItem.club?.nameEn || galleryItem.club?.nameVi || null,
        slot: MediaAssetReferenceSlot.CLUB_GALLERY_IMAGE,
        field: 'galleryMedia',
      });
    }

    for (const facility of facilities) {
      references.push({
        entityType: MediaAssetReferenceEntityType.FACILITY,
        entityId: facility.id,
        entityName: facility.nameEn || facility.nameVi || null,
        slot: MediaAssetReferenceSlot.FACILITY_COVER_IMAGE,
        field: 'coverImageAssetId',
      });
    }

    for (const level of membershipLevels) {
      references.push({
        entityType: MediaAssetReferenceEntityType.MEMBERSHIP_LEVEL,
        entityId: level.id,
        entityName: level.nameEn || level.nameVi || null,
        slot: MediaAssetReferenceSlot.MEMBERSHIP_LEVEL_IMAGE,
        field: 'imageAssetId',
      });
    }

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

    for (const setting of siteSettings) {
      references.push({
        entityType: MediaAssetReferenceEntityType.SITE_SETTING,
        entityId: setting.id,
        entityName: setting.labelEn || setting.key,
        slot: MediaAssetReferenceSlot.SITE_SETTING_MEDIA_ASSET,
        field: 'mediaAssetId',
      });
    }

    return references.sort((left, right) =>
      `${left.entityType}:${left.entityId}:${left.slot}:${left.locale ?? ''}`.localeCompare(
        `${right.entityType}:${right.entityId}:${right.slot}:${right.locale ?? ''}`,
      ),
    );
  }
}
