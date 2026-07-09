import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetsController } from './media-assets.controller';
import { MediaAssetsService } from './media-assets.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset, User])],
  providers: [MediaAssetsService],
  controllers: [MediaAssetsController],
})
export class MediaAssetsModule {}
