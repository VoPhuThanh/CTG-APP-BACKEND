import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../clubs/entities/club.entity';
import { User } from '../users/entities/user.entity';
import { MediaAssetsModule } from '../media-assets/media-assets.module';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    MediaAssetsModule,
    TypeOrmModule.forFeature([Club, Service, ServiceVariant, User]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
