import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permissions } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permissions, User])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
