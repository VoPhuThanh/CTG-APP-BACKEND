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
import { Service } from './service.entity';
import { ServiceSkillLevel, ServiceStatus } from '../enums/service.enum';

@Entity('service_variants')
@Unique(['service', 'slug'])
export class ServiceVariant extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Service, (service) => service.variants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'service_id',
  })
  service!: Service;

  @Column({ name: 'name_en', length: 150 })
  nameEn!: string;

  @Column({ name: 'name_vi', length: 150 })
  nameVi!: string;

  @Index()
  @Column({ length: 180 })
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

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'calories_burned_min', type: 'int', nullable: true })
  caloriesBurnedMin?: number;

  @Column({ name: 'calories_burned_max', type: 'int', nullable: true })
  caloriesBurnedMax?: number;

  @Column({
    name: 'skill_level',
    type: 'enum',
    enum: ServiceSkillLevel,
    default: ServiceSkillLevel.ALL_LEVELS,
  })
  skillLevel!: ServiceSkillLevel;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.DRAFT,
  })
  status!: ServiceStatus;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

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
