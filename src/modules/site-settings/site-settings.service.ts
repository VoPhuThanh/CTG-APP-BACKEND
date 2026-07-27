import { SITE_SETTING_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';
import {
  compactCollection,
  getNextDisplayOrder,
  lockOrderingCollections,
  OrderingCollections,
  reorderCollection,
} from '@/cores/ordering/ordering.helper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferenceSlot } from '../media-assets/enums/media-asset-reference.enum';
import { MediaAssetUsage } from '../media-assets/enums/media-asset.enum';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import type { SiteSettingCreateDto } from './dtos/create-site-setting.dto';
import type {
  PublicSiteSettingResponseDto,
  SiteSettingResponseDto,
} from './dtos/site-setting.dto';
import type { SiteSettingQueryDto } from './dtos/site-setting-query.dto';
import type { SiteSettingUpdateDto } from './dtos/update-site-setting.dto';
import { SiteSetting } from './entities/site-setting.entity';
import { SiteSettingValueType } from './enums/site-setting.enum';
import {
  mapSiteSettingToResponse,
  mapSiteSettingsToPublicResponses,
  mapSiteSettingsToResponses,
} from './site-settings.mapper';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SiteSetting)
    private readonly siteSettingRepository: Repository<SiteSetting>,

    private readonly mediaAssetReferencesService: MediaAssetReferencesService,
  ) {}

  async findPublic(
    query: SiteSettingQueryDto,
  ): Promise<PublicSiteSettingResponseDto[]> {
    const queryBuilder = this.siteSettingRepository
      .createQueryBuilder('setting')
      .leftJoinAndSelect('setting.mediaAsset', 'mediaAsset')
      .where('setting.isPublic = :isPublic', {
        isPublic: true,
      });

    if (query.group) {
      queryBuilder.andWhere('setting."group" = :group', {
        group: query.group,
      });
    }

    queryBuilder
      .orderBy('setting.group', 'ASC')
      .addOrderBy('setting.displayOrder', 'ASC')
      .addOrderBy('setting.key', 'ASC');

    const settings = await queryBuilder.getMany();

    return mapSiteSettingsToPublicResponses(settings);
  }

  async findAll(
    query: SiteSettingQueryDto,
  ): Promise<PaginatedResponseDto<SiteSettingResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.siteSettingRepository
      .createQueryBuilder('setting')
      .leftJoinAndSelect('setting.mediaAsset', 'mediaAsset')
      .leftJoinAndSelect('setting.createdBy', 'createdBy')
      .leftJoinAndSelect('setting.updatedBy', 'updatedBy');

    if (query.group) {
      queryBuilder.andWhere('setting."group" = :group', {
        group: query.group,
      });
    }

    if (query.valueType) {
      queryBuilder.andWhere('setting.valueType = :valueType', {
        valueType: query.valueType,
      });
    }

    if (query.isPublic !== undefined) {
      queryBuilder.andWhere('setting.isPublic = :isPublic', {
        isPublic: query.isPublic === 'true',
      });
    }

    if (query.isEditable !== undefined) {
      queryBuilder.andWhere('setting.isEditable = :isEditable', {
        isEditable: query.isEditable === 'true',
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          setting.key ILIKE :search
          OR setting."group" ILIKE :search
          OR setting.labelEn ILIKE :search
          OR setting.labelVi ILIKE :search
          OR setting.descriptionEn ILIKE :search
          OR setting.descriptionVi ILIKE :search
          OR setting.value ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in SITE_SETTING_SORT_FIELDS) {
      queryBuilder.orderBy(
        `setting.${
          SITE_SETTING_SORT_FIELDS[
            sortBy as keyof typeof SITE_SETTING_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('setting.group', 'ASC');
    }

    queryBuilder
      .addOrderBy('setting.displayOrder', 'ASC')
      .addOrderBy('setting.key', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [settings, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapSiteSettingsToResponses(settings),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<SiteSettingResponseDto> {
    const setting = await this.findEntityById(id);

    return mapSiteSettingToResponse(setting);
  }

  async findReorderList(group: string): Promise<SiteSettingResponseDto[]> {
    const settings = await this.siteSettingRepository.find({
      where: { group },
      relations: {
        mediaAsset: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    return mapSiteSettingsToResponses(settings);
  }

  async reorder(
    group: string,
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<SiteSettingResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);

    await this.siteSettingRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.siteSettings(group),
        orderedIds,
        updater.id,
      );
    });

    return this.findReorderList(group);
  }

  async create(
    dto: SiteSettingCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<SiteSettingResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    await this.ensureKeyIsAvailable(dto.key);

    const valueType = dto.valueType ?? SiteSettingValueType.TEXT;
    this.validateValueContract(dto.value, valueType, dto.mediaAssetId);

    let createdSettingId = '';
    await this.siteSettingRepository.manager.transaction(async (manager) => {
      const mediaAsset =
        valueType === SiteSettingValueType.MEDIA_ASSET
          ? await this.findImageAssetByIdOrThrow(dto.mediaAssetId, manager)
          : null;
      const repository = manager.getRepository(SiteSetting);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.siteSettings(dto.group),
      );
      const setting = repository.create({
        key: dto.key,
        group: dto.group,
        labelEn: dto.labelEn,
        labelVi: dto.labelVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        value: dto.value ?? null,
        valueType,
        mediaAsset,
        isPublic: dto.isPublic ?? false,
        isEditable: dto.isEditable ?? true,
        displayOrder,
        createdBy: creator,
        updatedBy: creator,
      });

      createdSettingId = (await repository.save(setting)).id;
    });

    return this.findOne(createdSettingId);
  }

  async update(
    id: string,
    dto: SiteSettingUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<SiteSettingResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const setting = await this.findEntityById(id);
    const previousGroup = setting.group;

    if (!setting.isEditable) {
      throw AppError.badRequest(AppErrorCode.SITE_SETTING_NOT_EDITABLE);
    }

    const wasMediaAsset =
      setting.valueType === SiteSettingValueType.MEDIA_ASSET;
    const nextValueType = dto.valueType ?? setting.valueType;
    const nextValue =
      dto.value !== undefined ? dto.value : (setting.value ?? null);

    this.validateValueContract(nextValue, nextValueType, dto.mediaAssetId);

    if (dto.group !== undefined) setting.group = dto.group;
    if (dto.labelEn !== undefined) setting.labelEn = dto.labelEn;
    if (dto.labelVi !== undefined) setting.labelVi = dto.labelVi;
    if (dto.descriptionEn !== undefined) {
      setting.descriptionEn = dto.descriptionEn;
    }
    if (dto.descriptionVi !== undefined) {
      setting.descriptionVi = dto.descriptionVi;
    }
    setting.value = nextValue;
    setting.valueType = nextValueType;
    if (dto.isPublic !== undefined) setting.isPublic = dto.isPublic;
    if (dto.isEditable !== undefined) setting.isEditable = dto.isEditable;
    setting.updatedBy = updater;

    await this.siteSettingRepository.manager.transaction(async (manager) => {
      const groupChanged = previousGroup !== setting.group;
      if (groupChanged) {
        await lockOrderingCollections(manager, [
          OrderingCollections.siteSettings(previousGroup),
          OrderingCollections.siteSettings(setting.group),
        ]);
        setting.displayOrder = await getNextDisplayOrder(
          manager,
          OrderingCollections.siteSettings(setting.group),
        );
      }

      if (nextValueType === SiteSettingValueType.MEDIA_ASSET) {
        if (dto.mediaAssetId !== undefined) {
          setting.mediaAsset = await this.findImageAssetByIdOrThrow(
            dto.mediaAssetId,
            manager,
          );
        } else if (!wasMediaAsset) {
          setting.mediaAsset = null;
        }
      } else {
        setting.mediaAsset = null;
      }

      await manager.getRepository(SiteSetting).save(setting);
      if (groupChanged) {
        await compactCollection(
          manager,
          OrderingCollections.siteSettings(previousGroup),
          updater.id,
        );
      }
    });

    return this.findOne(setting.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const setting = await this.findEntityById(id);

    if (!setting.isEditable) {
      throw AppError.badRequest(AppErrorCode.SITE_SETTING_NOT_EDITABLE);
    }

    await this.siteSettingRepository.manager.transaction(async (manager) => {
      await manager.update(SiteSetting, setting.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(SiteSetting, setting.id);
      await compactCollection(
        manager,
        OrderingCollections.siteSettings(setting.group),
        deleter.id,
      );
    });
  }

  private async findEntityById(id: string): Promise<SiteSetting> {
    const setting = await this.siteSettingRepository.findOne({
      where: {
        id,
      },
      relations: {
        mediaAsset: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!setting) {
      throw AppError.notFound(AppErrorCode.SITE_SETTING_NOT_FOUND);
    }

    return setting;
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }

  private async findImageAssetByIdOrThrow(
    id: string | null | undefined,
    manager: EntityManager,
  ): Promise<MediaAsset | null> {
    const result =
      await this.mediaAssetReferencesService.validateImageSelection(id, {
        manager,
        slot: MediaAssetReferenceSlot.SITE_SETTING_MEDIA_ASSET,
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.FORM],
      });

    return result.asset;
  }

  private validateValueContract(
    value: string | null | undefined,
    valueType: SiteSettingValueType,
    mediaAssetId: string | null | undefined,
  ): void {
    if (valueType === SiteSettingValueType.MEDIA_ASSET) {
      if (value !== null && value !== undefined)
        this.validateUrlLikeValue(value);
      return;
    }

    if (mediaAssetId) {
      throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
    }
    if (value === null || value === undefined) {
      throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
    }

    this.validateValueByType(value, valueType);
  }

  private async ensureKeyIsAvailable(key: string): Promise<void> {
    const existingSetting = await this.siteSettingRepository.findOne({
      where: {
        key,
      },
    });

    if (existingSetting) {
      throw AppError.conflict(AppErrorCode.SITE_SETTING_KEY_ALREADY_EXISTS);
    }
  }

  private validateValueByType(
    value: string,
    valueType: SiteSettingValueType,
  ): void {
    if (valueType === SiteSettingValueType.NUMBER) {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
      }

      return;
    }

    if (valueType === SiteSettingValueType.BOOLEAN) {
      if (value !== 'true' && value !== 'false') {
        throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
      }

      return;
    }

    if (valueType === SiteSettingValueType.URL) {
      this.validateUrlLikeValue(value);
      return;
    }

    if (valueType === SiteSettingValueType.IMAGE_URL) {
      this.validateUrlLikeValue(value);
      return;
    }

    if (valueType === SiteSettingValueType.JSON) {
      try {
        JSON.parse(value);
      } catch {
        throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
      }
    }
  }

  private validateUrlLikeValue(value: string): void {
    const isAbsoluteUrl =
      value.startsWith('http://') || value.startsWith('https://');

    const isRelativePath = value.startsWith('/');

    if (!isAbsoluteUrl && !isRelativePath) {
      throw AppError.badRequest(AppErrorCode.SITE_SETTING_INVALID_VALUE);
    }
  }
}
