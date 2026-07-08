import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Facility } from '@/modules/facilities/entities/facility.entity';
import { Service } from '@/modules/services/entities/service.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClubStatus } from '../enums/club.enum';

@Entity('clubs')
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

  @Column({ name: 'gallery_image_urls', type: 'jsonb', default: [] })
  galleryImageUrls!: string[];

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
