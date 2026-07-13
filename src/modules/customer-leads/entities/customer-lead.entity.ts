import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Club } from '@/modules/clubs/entities/club.entity';
import { MembershipLevel } from '@/modules/memberships/entities/membership-level.entity';
import { Service } from '@/modules/services/entities/service.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  BmiCategory,
  CustomerLeadGender,
  CustomerLeadSource,
  CustomerLeadStatus,
} from '../enums/customer-lead.enum';

@Entity('customer_leads')
export class CustomerLead extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', length: 150, nullable: true })
  fullName?: string;

  @Index()
  @Column({ name: 'phone_number', length: 30 })
  phoneNumber!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: CustomerLeadSource,
  })
  source!: CustomerLeadSource;

  @ManyToOne(() => Club, {
    nullable: true,
  })
  @JoinColumn({
    name: 'preferred_club_id',
  })
  preferredClub?: Club;

  @Column({ name: 'preferred_call_time', length: 100, nullable: true })
  preferredCallTime?: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({
    type: 'enum',
    enum: CustomerLeadGender,
    nullable: true,
  })
  gender?: CustomerLeadGender;

  @Column({ name: 'height_cm', type: 'int', nullable: true })
  heightCm?: number;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weightKg?: string;

  @Column({
    name: 'bmi_value',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  bmiValue?: string;

  @Column({
    name: 'bmi_category',
    type: 'enum',
    enum: BmiCategory,
    nullable: true,
  })
  bmiCategory?: BmiCategory;

  @ManyToOne(() => Service, {
    nullable: true,
  })
  @JoinColumn({
    name: 'interested_service_id',
  })
  interestedService?: Service;

  @ManyToOne(() => MembershipLevel, {
    nullable: true,
  })
  @JoinColumn({
    name: 'interested_membership_level_id',
  })
  interestedMembershipLevel?: MembershipLevel;

  @Index()
  @Column({
    type: 'enum',
    enum: CustomerLeadStatus,
    default: CustomerLeadStatus.NEW,
  })
  status!: CustomerLeadStatus;

  @Column({ name: 'internal_note', type: 'text', nullable: true })
  internalNote?: string;

  @Column({ name: 'consent_accepted', type: 'boolean', default: false })
  consentAccepted!: boolean;

  @Column({ name: 'consent_accepted_at', type: 'timestamptz', nullable: true })
  consentAcceptedAt?: Date;

  @Column({
    name: 'promotion_consent_accepted',
    type: 'boolean',
    default: false,
  })
  promotionConsentAccepted!: boolean;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({
    name: 'updated_by',
  })
  updatedBy?: User;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({
    name: 'deleted_by',
  })
  deletedBy?: User;
}
