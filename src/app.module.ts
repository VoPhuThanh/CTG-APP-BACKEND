import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './configs/database.config';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { ServicesModule } from './modules/services/services.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { PostsModule } from './modules/posts/posts.module';
import { BannersModule } from './modules/banners/banners.module';
import { CustomerLeadsModule } from './modules/customer-leads/customer-leads.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { MediaAssetsModule } from './modules/media-assets/media-assets.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getDatabaseConfig(config),
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    ClubsModule,
    FacilitiesModule,
    ServicesModule,
    MembershipsModule,
    PostsModule,
    BannersModule,
    CustomerLeadsModule,
    SiteSettingsModule,
    MediaAssetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
