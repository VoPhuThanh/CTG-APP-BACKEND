import { BaseEntityCore } from '@/cores/entities/core-entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MembershipStatus } from '../enums/membership.enum';
import { MembershipLevel } from './membership-level.entity';

@Entity('membership_plans')
@Unique(['level', 'durationMonths'])
@Index(
  'UQ_membership_plans_active_level_display_order',
  ['level', 'displayOrder'],
  {
    unique: true,
    where: '"deletedAt" IS NULL',
  },
)
export class MembershipPlan extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MembershipLevel, (level) => level.plans, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'membership_level_id',
  })
  level!: MembershipLevel;

  @Column({ name: 'duration_months', type: 'int' })
  durationMonths!: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 14, scale: 2 })
  totalPrice!: string;

  @Column({ length: 10, default: 'VND' })
  currency!: string;

  @Column({ name: 'label_en', length: 100, nullable: true })
  labelEn?: string;

  @Column({ name: 'label_vi', length: 100, nullable: true })
  labelVi?: string;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.DRAFT,
  })
  status!: MembershipStatus;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({
    name: 'created_by',
  })
  createdBy?: User;

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
