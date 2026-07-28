import { BaseEntityCore } from '@/cores/entities/core-entity';
import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import { Facility } from '@/modules/facilities/entities/facility.entity';
import { Service } from '@/modules/services/entities/service.entity';
import { ServiceVariant } from '@/modules/services/entities/service-variant.entity';
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
import { ClubStatus } from '../enums/club.enum';
import { ClubGalleryMediaAsset } from './club-gallery-media-asset.entity';

@Entity('clubs')
@Index('UQ_clubs_active_display_order', ['displayOrder'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Club extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name_en', length: 150 })
  nameEn!: string;

  @Column({ name: 'name_vi', length: 150 })
  nameVi!: string;

  @Index()
  @Column({ unique: true, length: 180 })
  slug!: string;

  @Column({ name: 'address_en', type: 'text' })
  addressEn!: string;

  @Column({ name: 'address_vi', type: 'text' })
  addressVi!: string;

  @Column({ name: 'opening_hours_text_en', type: 'text', nullable: true })
  openingHoursTextEn?: string;

  @Column({ name: 'opening_hours_text_vi', type: 'text', nullable: true })
  openingHoursTextVi?: string;

  @Column({ name: 'phone_numbers', type: 'jsonb', default: [] })
  phoneNumbers!: string[];

  @Column({ name: 'short_description_en', type: 'text', nullable: true })
  shortDescriptionEn?: string;

  @Column({ name: 'short_description_vi', type: 'text', nullable: true })
  shortDescriptionVi?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi?: string;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;

  @Index('IDX_clubs_cover_image_asset_id')
  @Column({ name: 'cover_image_asset_id', type: 'uuid', nullable: true })
  coverImageAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'cover_image_asset_id',
    foreignKeyConstraintName: 'FK_clubs_cover_image_asset',
  })
  coverImageAsset!: MediaAsset | null;

  @Column({ name: 'gallery_image_urls', type: 'jsonb', default: [] })
  galleryImageUrls!: string[];

  @OneToMany(() => ClubGalleryMediaAsset, (galleryItem) => galleryItem.club)
  galleryMedia!: ClubGalleryMediaAsset[];

  @Column({
    type: 'enum',
    enum: ClubStatus,
    default: ClubStatus.DRAFT,
  })
  status!: ClubStatus;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @ManyToMany(() => Facility, (facility) => facility.clubs)
  @JoinTable({
    name: 'club_facilities',
    joinColumn: {
      name: 'club_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'facility_id',
      referencedColumnName: 'id',
    },
  })
  facilities!: Facility[];

  @ManyToMany(() => Service, (service) => service.clubs)
  @JoinTable({
    name: 'club_services',
    joinColumn: {
      name: 'club_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'service_id',
      referencedColumnName: 'id',
    },
  })
  services!: Service[];

  @ManyToMany(() => ServiceVariant, (variant) => variant.clubs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  serviceVariants!: ServiceVariant[];

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
