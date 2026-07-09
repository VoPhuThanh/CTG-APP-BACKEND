import { BaseEntityCore } from '@/cores/entities/core-entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MembershipStatus } from '../enums/membership.enum';
import { MembershipBenefit } from './membership-benefit.entity';
import { MembershipPlan } from './membership-plan.entity';

@Entity('membership_levels')
export class MembershipLevel extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name_en', length: 150 })
  nameEn!: string;

  @Column({ name: 'name_vi', length: 150 })
  nameVi!: string;

  @Index()
  @Column({ unique: true, length: 180 })
  slug!: string;

  @Column({ name: 'short_description_en', type: 'text', nullable: true })
  shortDescriptionEn?: string;

  @Column({ name: 'short_description_vi', type: 'text', nullable: true })
  shortDescriptionVi?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi?: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string;

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

  @OneToMany(() => MembershipPlan, (plan) => plan.level)
  plans!: MembershipPlan[];

  @ManyToMany(() => MembershipBenefit, (benefit) => benefit.levels)
  @JoinTable({
    name: 'membership_level_benefits',
    joinColumn: {
      name: 'membership_level_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'membership_benefit_id',
      referencedColumnName: 'id',
    },
  })
  benefits!: MembershipBenefit[];

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
