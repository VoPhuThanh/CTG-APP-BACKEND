import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Club } from '@/modules/clubs/entities/club.entity';
import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('facilities')
export class Facility extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name_en', length: 150 })
  nameEn!: string;

  @Column({ name: 'name_vi', length: 150 })
  nameVi!: string;

  @Index()
  @Column({ unique: true, length: 180 })
  slug!: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi?: string;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;

  @Index('IDX_facilities_cover_image_asset_id')
  @Column({ name: 'cover_image_asset_id', type: 'uuid', nullable: true })
  coverImageAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'cover_image_asset_id',
    foreignKeyConstraintName: 'FK_facilities_cover_image_asset',
  })
  coverImageAsset!: MediaAsset | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @ManyToMany(() => Club, (club) => club.facilities)
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
