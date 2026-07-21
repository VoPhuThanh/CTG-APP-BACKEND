import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { MEDIA_STORAGE_CONFIG } from '@/cores/storage/storage.module';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, IsNull, type EntityManager, type Repository } from 'typeorm';

import { Banner } from '../banners/entities/banner.entity';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Club } from '../clubs/entities/club.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import {
  LegacyServiceMediaSourceError,
  LegacyServiceMediaSourceReader,
} from '../services/legacy-service-media-source.reader';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { SiteSettingValueType } from '../site-settings/enums/site-setting.enum';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetReferenceSlot } from './enums/media-asset-reference.enum';
import { MediaAssetUsage } from './enums/media-asset.enum';
import { MediaAssetsService } from './media-assets.service';

export interface LegacyEditorialMediaImportOptions {
  dryRun?: boolean;
  sourceDirectory?: string;
  timeoutMs?: number;
  maxRedirects?: number;
}

type ImportEntityType =
  | 'banner'
  | 'club'
  | 'facility'
  | 'membership_level'
  | 'site_setting';

type ImportLegacyField =
  | 'imageUrl'
  | 'mobileImageUrl'
  | 'coverImageUrl'
  | 'galleryImageUrls'
  | 'value';

export interface LegacyEditorialMediaImportEntry {
  entityType: ImportEntityType;
  entityId: string;
  entityName: string;
  slot: MediaAssetReferenceSlot;
  legacyField: ImportLegacyField;
  legacyUrl: string;
  displayOrder?: number;
  assetId?: string;
  checksum?: string;
  storageKey?: string;
  action?: 'create_asset' | 'reuse_asset';
  reason?: string;
  message?: string;
}

export interface LegacyEditorialMediaImportReport {
  mode: 'dry_run' | 'apply';
  startedAt: string;
  completedAt: string;
  imported: LegacyEditorialMediaImportEntry[];
  planned: LegacyEditorialMediaImportEntry[];
  skipped: LegacyEditorialMediaImportEntry[];
  failed: LegacyEditorialMediaImportEntry[];
  unresolved: LegacyEditorialMediaImportEntry[];
  summary: {
    candidates: number;
    imported: number;
    planned: number;
    skipped: number;
    failed: number;
    unresolved: number;
  };
}

interface FixedImportCandidate extends LegacyEditorialMediaImportEntry {
  kind: 'fixed';
  currentAssetId: string | null;
  usage: MediaAssetUsage;
}

interface GalleryImportCandidate {
  kind: 'gallery';
  entityType: 'club';
  entityId: string;
  entityName: string;
  legacyUrls: string[];
  hasManagedGallery: boolean;
}

const DEFAULT_IMPORT_TIMEOUT_MS = 5_000;
const DEFAULT_IMPORT_MAX_REDIRECTS = 3;

@Injectable()
export class LegacyEditorialMediaImportService {
  constructor(
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
    @InjectRepository(SiteSetting)
    private readonly siteSettingRepository: Repository<SiteSetting>,
    private readonly mediaAssetsService: MediaAssetsService,
    private readonly sourceReader: LegacyServiceMediaSourceReader,
    @Inject(MEDIA_STORAGE_CONFIG)
    private readonly storageConfig: MediaStorageConfig,
  ) {}

  async importLegacyMedia(
    options: LegacyEditorialMediaImportOptions = {},
  ): Promise<LegacyEditorialMediaImportReport> {
    const startedAt = new Date().toISOString();
    const dryRun = options.dryRun ?? true;
    const timeoutMs = options.timeoutMs ?? DEFAULT_IMPORT_TIMEOUT_MS;
    const maxRedirects = options.maxRedirects ?? DEFAULT_IMPORT_MAX_REDIRECTS;
    this.assertPositiveInteger(timeoutMs, 'timeoutMs');
    this.assertNonNegativeInteger(maxRedirects, 'maxRedirects');

    const { fixedCandidates, galleryCandidates } = await this.findCandidates();
    const imported: LegacyEditorialMediaImportEntry[] = [];
    const planned: LegacyEditorialMediaImportEntry[] = [];
    const skipped: LegacyEditorialMediaImportEntry[] = [];
    const failed: LegacyEditorialMediaImportEntry[] = [];
    const unresolved: LegacyEditorialMediaImportEntry[] = [];

    for (const candidate of fixedCandidates) {
      const entry = this.toEntry(candidate);
      if (candidate.currentAssetId) {
        skipped.push({
          ...entry,
          assetId: candidate.currentAssetId,
          reason: 'managed_assignment_exists',
          message:
            'The managed slot is already assigned and was not overwritten.',
        });
        continue;
      }

      try {
        const prepared = await this.prepareSource(candidate, options, {
          dryRun,
          timeoutMs,
          maxRedirects,
        });
        const preparedEntry: LegacyEditorialMediaImportEntry = {
          ...entry,
          ...(prepared.asset ? { assetId: prepared.asset.id } : {}),
          checksum: prepared.checksum,
          storageKey: prepared.storageKey,
          action: prepared.action,
        };

        if (dryRun) {
          planned.push(preparedEntry);
          unresolved.push({
            ...preparedEntry,
            reason: 'dry_run',
            message: 'Dry-run mode does not create or assign media assets.',
          });
          continue;
        }

        const assignment = await this.assignFixedCandidate(
          candidate,
          prepared.asset!,
        );
        if (assignment === 'assigned') {
          imported.push(preparedEntry);
        } else {
          const skippedEntry = {
            ...preparedEntry,
            reason: assignment,
            message:
              assignment === 'managed_assignment_exists'
                ? 'The managed slot was assigned by another process.'
                : 'The legacy source changed while the import was running.',
          };
          skipped.push(skippedEntry);
          if (assignment === 'legacy_source_changed') {
            unresolved.push(skippedEntry);
          }
        }
      } catch (error) {
        const failure = this.toFailure(entry, error);
        failed.push(failure);
        unresolved.push(failure);
      }
    }

    for (const gallery of galleryCandidates) {
      const baseEntries = gallery.legacyUrls.map((legacyUrl, displayOrder) =>
        this.toGalleryEntry(gallery, legacyUrl, displayOrder),
      );
      if (gallery.hasManagedGallery) {
        skipped.push(
          ...baseEntries.map((entry) => ({
            ...entry,
            reason: 'managed_gallery_exists',
            message:
              'The club already has a managed gallery and was not overwritten.',
          })),
        );
        continue;
      }

      const preparedItems: Array<{
        entry: LegacyEditorialMediaImportEntry;
        asset: MediaAsset | null;
      }> = [];
      let galleryFailure = false;

      for (const entry of baseEntries) {
        try {
          const prepared = await this.prepareSource(
            {
              ...entry,
              kind: 'fixed',
              currentAssetId: null,
              usage: MediaAssetUsage.CLUB,
            },
            options,
            { dryRun, timeoutMs, maxRedirects },
          );
          const preparedEntry = {
            ...entry,
            ...(prepared.asset ? { assetId: prepared.asset.id } : {}),
            checksum: prepared.checksum,
            storageKey: prepared.storageKey,
            action: prepared.action,
          };
          preparedItems.push({ entry: preparedEntry, asset: prepared.asset });
        } catch (error) {
          const failure = this.toFailure(entry, error);
          failed.push(failure);
          unresolved.push(failure);
          galleryFailure = true;
        }
      }

      if (galleryFailure) {
        unresolved.push(
          ...preparedItems.map(({ entry }) => ({
            ...entry,
            reason: 'gallery_group_failed',
            message:
              'The gallery was not assigned because another legacy item failed.',
          })),
        );
        continue;
      }

      if (dryRun) {
        planned.push(...preparedItems.map(({ entry }) => entry));
        unresolved.push(
          ...preparedItems.map(({ entry }) => ({
            ...entry,
            reason: 'dry_run',
            message: 'Dry-run mode does not create or assign media assets.',
          })),
        );
        continue;
      }

      const assignment = await this.assignGallery(
        gallery,
        preparedItems.map(({ asset }) => asset!),
      );
      if (assignment === 'assigned') {
        imported.push(...preparedItems.map(({ entry }) => entry));
      } else {
        const entries = preparedItems.map(({ entry }) => ({
          ...entry,
          reason: assignment,
          message:
            assignment === 'managed_gallery_exists'
              ? 'The managed gallery was assigned by another process.'
              : 'The legacy gallery changed while the import was running.',
        }));
        skipped.push(...entries);
        if (assignment === 'legacy_source_changed') unresolved.push(...entries);
      }
    }

    const candidates =
      fixedCandidates.length +
      galleryCandidates.reduce(
        (count, gallery) => count + gallery.legacyUrls.length,
        0,
      );

    return {
      mode: dryRun ? 'dry_run' : 'apply',
      startedAt,
      completedAt: new Date().toISOString(),
      imported,
      planned,
      skipped,
      failed,
      unresolved,
      summary: {
        candidates,
        imported: imported.length,
        planned: planned.length,
        skipped: skipped.length,
        failed: failed.length,
        unresolved: unresolved.length,
      },
    };
  }

  private async findCandidates(): Promise<{
    fixedCandidates: FixedImportCandidate[];
    galleryCandidates: GalleryImportCandidate[];
  }> {
    const [banners, clubs, facilities, membershipLevels, siteSettings] =
      await Promise.all([
        this.bannerRepository.find({
          where: [
            { imageUrl: Not(IsNull()) },
            { mobileImageUrl: Not(IsNull()) },
          ],
          order: { id: 'ASC' },
        }),
        this.clubRepository.find({
          relations: { galleryMedia: true },
          order: { id: 'ASC' },
        }),
        this.facilityRepository.find({
          where: { coverImageUrl: Not(IsNull()) },
          order: { id: 'ASC' },
        }),
        this.membershipLevelRepository.find({
          where: { imageUrl: Not(IsNull()) },
          order: { id: 'ASC' },
        }),
        this.siteSettingRepository.find({
          where: {
            valueType: In([
              SiteSettingValueType.IMAGE_URL,
              SiteSettingValueType.MEDIA_ASSET,
            ]),
            value: Not(IsNull()),
          },
          order: { id: 'ASC' },
        }),
      ]);

    const fixedCandidates: FixedImportCandidate[] = [];
    for (const banner of banners) {
      if (banner.imageUrl) {
        fixedCandidates.push({
          kind: 'fixed',
          entityType: 'banner',
          entityId: banner.id,
          entityName: banner.titleEn || banner.titleVi || banner.id,
          slot: MediaAssetReferenceSlot.BANNER_IMAGE,
          legacyField: 'imageUrl',
          legacyUrl: banner.imageUrl,
          currentAssetId: banner.imageAssetId,
          usage: MediaAssetUsage.BANNER,
        });
      }
      if (banner.mobileImageUrl) {
        fixedCandidates.push({
          kind: 'fixed',
          entityType: 'banner',
          entityId: banner.id,
          entityName: banner.titleEn || banner.titleVi || banner.id,
          slot: MediaAssetReferenceSlot.BANNER_MOBILE_IMAGE,
          legacyField: 'mobileImageUrl',
          legacyUrl: banner.mobileImageUrl,
          currentAssetId: banner.mobileImageAssetId,
          usage: MediaAssetUsage.BANNER,
        });
      }
    }

    const galleryCandidates: GalleryImportCandidate[] = [];
    for (const club of clubs) {
      if (club.coverImageUrl) {
        fixedCandidates.push({
          kind: 'fixed',
          entityType: 'club',
          entityId: club.id,
          entityName: club.nameEn,
          slot: MediaAssetReferenceSlot.CLUB_COVER_IMAGE,
          legacyField: 'coverImageUrl',
          legacyUrl: club.coverImageUrl,
          currentAssetId: club.coverImageAssetId,
          usage: MediaAssetUsage.CLUB,
        });
      }
      const legacyUrls = (club.galleryImageUrls ?? []).filter(Boolean);
      if (legacyUrls.length > 0) {
        galleryCandidates.push({
          kind: 'gallery',
          entityType: 'club',
          entityId: club.id,
          entityName: club.nameEn,
          legacyUrls,
          hasManagedGallery: (club.galleryMedia?.length ?? 0) > 0,
        });
      }
    }

    for (const facility of facilities) {
      if (!facility.coverImageUrl) continue;
      fixedCandidates.push({
        kind: 'fixed',
        entityType: 'facility',
        entityId: facility.id,
        entityName: facility.nameEn,
        slot: MediaAssetReferenceSlot.FACILITY_COVER_IMAGE,
        legacyField: 'coverImageUrl',
        legacyUrl: facility.coverImageUrl,
        currentAssetId: facility.coverImageAssetId,
        usage: MediaAssetUsage.GENERAL,
      });
    }

    for (const level of membershipLevels) {
      if (!level.imageUrl) continue;
      fixedCandidates.push({
        kind: 'fixed',
        entityType: 'membership_level',
        entityId: level.id,
        entityName: level.nameEn,
        slot: MediaAssetReferenceSlot.MEMBERSHIP_LEVEL_IMAGE,
        legacyField: 'imageUrl',
        legacyUrl: level.imageUrl,
        currentAssetId: level.imageAssetId,
        usage: MediaAssetUsage.GENERAL,
      });
    }

    for (const setting of siteSettings) {
      if (!setting.value) continue;
      fixedCandidates.push({
        kind: 'fixed',
        entityType: 'site_setting',
        entityId: setting.id,
        entityName: setting.labelEn || setting.key,
        slot: MediaAssetReferenceSlot.SITE_SETTING_MEDIA_ASSET,
        legacyField: 'value',
        legacyUrl: setting.value,
        currentAssetId: setting.mediaAssetId,
        usage: MediaAssetUsage.FORM,
      });
    }

    fixedCandidates.sort((left, right) =>
      `${left.entityType}:${left.entityId}:${left.slot}`.localeCompare(
        `${right.entityType}:${right.entityId}:${right.slot}`,
      ),
    );
    return { fixedCandidates, galleryCandidates };
  }

  private async prepareSource(
    candidate: FixedImportCandidate,
    options: LegacyEditorialMediaImportOptions,
    runtime: { dryRun: boolean; timeoutMs: number; maxRedirects: number },
  ) {
    const source = await this.sourceReader.read(candidate.legacyUrl, {
      sourceDirectory: options.sourceDirectory,
      timeoutMs: runtime.timeoutMs,
      maxBytes: this.storageConfig.maxFileSizeBytes,
      maxRedirects: runtime.maxRedirects,
    });

    return this.mediaAssetsService.importImage({
      buffer: source.buffer,
      originalFilename: source.originalFilename,
      declaredMimeType: source.declaredMimeType,
      name: `Imported ${candidate.entityName}`,
      storagePrefix: 'imports/editorial',
      usage: candidate.usage,
      dryRun: runtime.dryRun,
    });
  }

  private async assignFixedCandidate(
    candidate: FixedImportCandidate,
    asset: MediaAsset,
  ): Promise<
    'assigned' | 'managed_assignment_exists' | 'legacy_source_changed'
  > {
    return this.bannerRepository.manager.transaction(async (manager) => {
      if (candidate.entityType === 'banner') {
        const banner = await this.lockEntity(
          manager,
          Banner,
          candidate.entityId,
        );
        if (!banner) return 'managed_assignment_exists';
        if (candidate.legacyField === 'imageUrl') {
          if (banner.imageAssetId) return 'managed_assignment_exists';
          if (banner.imageUrl !== candidate.legacyUrl) {
            return 'legacy_source_changed';
          }
          banner.imageAsset = asset;
        } else {
          if (banner.mobileImageAssetId) return 'managed_assignment_exists';
          if (banner.mobileImageUrl !== candidate.legacyUrl) {
            return 'legacy_source_changed';
          }
          banner.mobileImageAsset = asset;
        }
        await manager.getRepository(Banner).save(banner);
        return 'assigned';
      }

      if (candidate.entityType === 'club') {
        const club = await this.lockEntity(manager, Club, candidate.entityId);
        if (!club || club.coverImageAssetId) {
          return 'managed_assignment_exists';
        }
        if (club.coverImageUrl !== candidate.legacyUrl) {
          return 'legacy_source_changed';
        }
        club.coverImageAsset = asset;
        await manager.getRepository(Club).save(club);
        return 'assigned';
      }

      if (candidate.entityType === 'facility') {
        const facility = await this.lockEntity(
          manager,
          Facility,
          candidate.entityId,
        );
        if (!facility || facility.coverImageAssetId) {
          return 'managed_assignment_exists';
        }
        if (facility.coverImageUrl !== candidate.legacyUrl) {
          return 'legacy_source_changed';
        }
        facility.coverImageAsset = asset;
        await manager.getRepository(Facility).save(facility);
        return 'assigned';
      }

      if (candidate.entityType === 'membership_level') {
        const level = await this.lockEntity(
          manager,
          MembershipLevel,
          candidate.entityId,
        );
        if (!level || level.imageAssetId) return 'managed_assignment_exists';
        if (level.imageUrl !== candidate.legacyUrl) {
          return 'legacy_source_changed';
        }
        level.imageAsset = asset;
        await manager.getRepository(MembershipLevel).save(level);
        return 'assigned';
      }

      const setting = await this.lockEntity(
        manager,
        SiteSetting,
        candidate.entityId,
      );
      if (!setting || setting.mediaAssetId) return 'managed_assignment_exists';
      if (
        setting.value !== candidate.legacyUrl ||
        ![
          SiteSettingValueType.IMAGE_URL,
          SiteSettingValueType.MEDIA_ASSET,
        ].includes(setting.valueType)
      ) {
        return 'legacy_source_changed';
      }
      setting.valueType = SiteSettingValueType.MEDIA_ASSET;
      setting.mediaAsset = asset;
      await manager.getRepository(SiteSetting).save(setting);
      return 'assigned';
    });
  }

  private async assignGallery(
    candidate: GalleryImportCandidate,
    assets: MediaAsset[],
  ): Promise<'assigned' | 'managed_gallery_exists' | 'legacy_source_changed'> {
    return this.clubRepository.manager.transaction(async (manager) => {
      const club = await this.lockEntity(manager, Club, candidate.entityId);
      if (!club) return 'managed_gallery_exists';

      const galleryRepository = manager.getRepository(ClubGalleryMediaAsset);
      if ((await galleryRepository.count({ where: { clubId: club.id } })) > 0) {
        return 'managed_gallery_exists';
      }
      if (!sameStringArray(club.galleryImageUrls ?? [], candidate.legacyUrls)) {
        return 'legacy_source_changed';
      }

      await galleryRepository.save(
        assets.map((asset, displayOrder) =>
          galleryRepository.create({
            club,
            clubId: club.id,
            mediaAsset: asset,
            mediaAssetId: asset.id,
            displayOrder,
          }),
        ),
      );
      return 'assigned';
    });
  }

  private lockEntity<T extends object>(
    manager: EntityManager,
    entity: new () => T,
    id: string,
  ): Promise<T | null> {
    return manager.getRepository(entity).findOne({
      where: { id } as never,
      lock: { mode: 'pessimistic_write' },
    });
  }

  private toEntry(candidate: FixedImportCandidate) {
    return {
      entityType: candidate.entityType,
      entityId: candidate.entityId,
      entityName: candidate.entityName,
      slot: candidate.slot,
      legacyField: candidate.legacyField,
      legacyUrl: candidate.legacyUrl,
    };
  }

  private toGalleryEntry(
    candidate: GalleryImportCandidate,
    legacyUrl: string,
    displayOrder: number,
  ): LegacyEditorialMediaImportEntry {
    return {
      entityType: 'club',
      entityId: candidate.entityId,
      entityName: candidate.entityName,
      slot: MediaAssetReferenceSlot.CLUB_GALLERY_IMAGE,
      legacyField: 'galleryImageUrls',
      legacyUrl,
      displayOrder,
    };
  }

  private toFailure(
    entry: LegacyEditorialMediaImportEntry,
    error: unknown,
  ): LegacyEditorialMediaImportEntry {
    return {
      ...entry,
      reason:
        error instanceof LegacyServiceMediaSourceError
          ? error.code
          : 'import_failed',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  private assertPositiveInteger(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer.`);
    }
  }

  private assertNonNegativeInteger(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative integer.`);
    }
  }
}

function sameStringArray(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
