import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MediaAssetsModule } from '../media-assets/media-assets.module';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import { LegacyPostContentImportService } from './legacy-post-content-import.service';
import { LegacyPostContentSourceReader } from './legacy-post-content-source.reader';
import { PostsController } from './posts.controller';
import { PostContentSanitizerService } from './post-content-sanitizer.service';
import { PostContentRendererService } from './post-content-renderer.service';
import { PostInlineMediaService } from './post-inline-media.service';
import { PostInlineMediaAsset } from './entities/post-inline-media-asset.entity';
import { PostsService } from './posts.service';

@Module({
  imports: [
    MediaAssetsModule,
    TypeOrmModule.forFeature([Post, PostCategory, PostInlineMediaAsset, User]),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostContentSanitizerService,
    PostContentRendererService,
    PostInlineMediaService,
    LegacyPostContentSourceReader,
    LegacyPostContentImportService,
  ],
})
export class PostsModule {}
