import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MembershipBenefit } from './entities/membership-benefit.entity';
import { MembershipLevel } from './entities/membership-level.entity';
import { MembershipPlan } from './entities/membership-plan.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { MediaAssetsModule } from '../media-assets/media-assets.module';

@Module({
  imports: [
    MediaAssetsModule,
    TypeOrmModule.forFeature([
      MembershipBenefit,
      MembershipLevel,
      MembershipPlan,
      User,
    ]),
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
