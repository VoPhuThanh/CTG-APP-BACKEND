import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permissions } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permissions, User])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
