import { BaseEntityCore } from '@/cores/entities/core-entity';
import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SiteSettingValueType } from '../enums/site-setting.enum';

@Entity('site_settings')
@Index(
  'UQ_site_settings_active_group_display_order',
  ['group', 'displayOrder'],
  {
    unique: true,
    where: '"deletedAt" IS NULL',
  },
)
export class SiteSetting extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true, length: 100 })
  key!: string;

  @Index()
  @Column({ length: 100 })
  group!: string;

  @Column({ name: 'label_en', length: 150 })
  labelEn!: string;

  @Column({ name: 'label_vi', length: 150, nullable: true })
  labelVi?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi?: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({
    name: 'value_type',
    type: 'enum',
    enum: SiteSettingValueType,
    default: SiteSettingValueType.TEXT,
  })
  valueType!: SiteSettingValueType;

  @Index('IDX_site_settings_media_asset_id')
  @Column({ name: 'media_asset_id', type: 'uuid', nullable: true })
  mediaAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'media_asset_id',
    foreignKeyConstraintName: 'FK_site_settings_media_asset',
  })
  mediaAsset!: MediaAsset | null;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ name: 'is_editable', type: 'boolean', default: true })
  isEditable!: boolean;

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
