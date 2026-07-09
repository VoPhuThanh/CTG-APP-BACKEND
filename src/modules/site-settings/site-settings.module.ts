import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SiteSetting } from './entities/site-setting.entity';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSetting, User])],
  providers: [SiteSettingsService],
  controllers: [SiteSettingsController],
})
export class SiteSettingsModule {}
