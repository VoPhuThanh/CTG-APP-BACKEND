import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from '../facilities/entities/facility.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { MediaAssetsModule } from '../media-assets/media-assets.module';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { Club } from './entities/club.entity';
import { ClubGalleryMediaAsset } from './entities/club-gallery-media-asset.entity';

@Module({
  imports: [
    MediaAssetsModule,
    TypeOrmModule.forFeature([
      Club,
      ClubGalleryMediaAsset,
      Facility,
      Service,
      ServiceVariant,
      User,
    ]),
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
})
export class ClubsModule {}
