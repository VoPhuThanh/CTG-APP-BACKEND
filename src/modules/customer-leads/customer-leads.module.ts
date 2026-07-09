import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../clubs/entities/club.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipBenefit } from '../memberships/entities/membership-benefit.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { MembershipPlan } from '../memberships/entities/membership-plan.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { CustomerLeadsController } from './customer-leads.controller';
import { CustomerLeadsService } from './customer-leads.service';
import { CustomerLead } from './entities/customer-lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerLead,
      Club,
      Facility,
      Service,
      ServiceVariant,
      MembershipLevel,
      MembershipPlan,
      MembershipBenefit,
      User,
    ]),
  ],
  controllers: [CustomerLeadsController],
  providers: [CustomerLeadsService],
})
export class CustomerLeadsModule {}
