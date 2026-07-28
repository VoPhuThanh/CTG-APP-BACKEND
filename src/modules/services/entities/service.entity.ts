import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Club } from '@/modules/clubs/entities/club.entity';
import { User } from '@/modules/users/entities/user.entity';
import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceVariant } from './service-variant.entity';
import { ServiceStatus } from '../enums/service.enum';

@Entity('services')
@Index('UQ_services_active_display_order', ['displayOrder'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Service extends BaseEntityCore {
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

  @Index('IDX_services_image_asset_id')
  @Column({ name: 'image_asset_id', type: 'uuid', nullable: true })
  imageAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'image_asset_id',
    foreignKeyConstraintName: 'FK_services_image_asset',
  })
  imageAsset!: MediaAsset | null;

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

  @OneToMany(() => ServiceVariant, (variant) => variant.service)
  variants!: ServiceVariant[];

  @ManyToMany(() => Club, (club) => club.services)
  clubs!: Club[];

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
