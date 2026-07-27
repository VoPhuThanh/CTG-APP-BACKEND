import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetOrphanCleanupService } from './media-asset-orphan-cleanup.service';
import { MediaAssetReferencesService } from './media-asset-references.service';
import { MediaAssetsController } from './media-assets.controller';
import { MediaAssetsService } from './media-assets.service';
import { MediaImageUploadInterceptor } from './interceptors/media-image-upload.interceptor';
import { PostInlineMediaAsset } from '../posts/entities/post-inline-media-asset.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Club } from '../clubs/entities/club.entity';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { LegacyServiceMediaSourceReader } from '../services/legacy-service-media-source.reader';
import { LegacyEditorialMediaImportService } from './legacy-editorial-media-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaAsset,
      Banner,
      Club,
      ClubGalleryMediaAsset,
      Facility,
      MembershipLevel,
      Post,
      PostInlineMediaAsset,
      Service,
      ServiceVariant,
      SiteSetting,
      User,
    ]),
  ],
  providers: [
    MediaAssetsService,
    LegacyEditorialMediaImportService,
    LegacyServiceMediaSourceReader,
    MediaAssetReferencesService,
    MediaAssetOrphanCleanupService,
    MediaImageUploadInterceptor,
  ],
  controllers: [MediaAssetsController],
  exports: [
    LegacyEditorialMediaImportService,
    MediaAssetsService,
    MediaAssetReferencesService,
    MediaAssetOrphanCleanupService,
  ],
})
export class MediaAssetsModule {}
