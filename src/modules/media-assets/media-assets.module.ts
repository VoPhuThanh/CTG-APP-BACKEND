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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaAsset,
      Post,
      PostInlineMediaAsset,
      Service,
      ServiceVariant,
      User,
    ]),
  ],
  providers: [
    MediaAssetsService,
    MediaAssetReferencesService,
    MediaAssetOrphanCleanupService,
    MediaImageUploadInterceptor,
  ],
  controllers: [MediaAssetsController],
  exports: [MediaAssetReferencesService, MediaAssetOrphanCleanupService],
})
export class MediaAssetsModule {}
