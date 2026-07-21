import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MediaAssetsModule } from '../media-assets/media-assets.module';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';

@Module({
  imports: [MediaAssetsModule, TypeOrmModule.forFeature([Banner, User])],
  providers: [BannersService],
  controllers: [BannersController],
})
export class BannersModule {}
