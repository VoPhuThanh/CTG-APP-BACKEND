import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Facility } from './entities/facility.entity';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { Club } from '../clubs/entities/club.entity';
import { MediaAssetsModule } from '../media-assets/media-assets.module';

@Module({
  imports: [
    MediaAssetsModule,
    TypeOrmModule.forFeature([Facility, User, Club]),
  ],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
