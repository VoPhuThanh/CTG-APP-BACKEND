import { BaseEntityCore } from '@/cores/entities/core-entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MediaAssetType, MediaAssetUsage } from '../enums/media-asset.enum';

@Entity('media_assets')
@Index('IDX_media_assets_deleted_at', ['deletedAt'], {
  where: '"deletedAt" IS NOT NULL',
})
export class MediaAsset extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ length: 150 })
  name!: string;

  @Column({ name: 'alt_text_en', length: 255, nullable: true })
  altTextEn?: string;

  @Column({ name: 'alt_text_vi', length: 255, nullable: true })
  altTextVi?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_vi', type: 'text', nullable: true })
  descriptionVi?: string;

  @Column({ type: 'text', nullable: true })
  url!: string | null;

  @Column({
    name: 'storage_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  storageProvider!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bucket!: string | null;

  @Index('UQ_media_assets_storage_key', { unique: true })
  @Column({
    name: 'storage_key',
    type: 'varchar',
    length: 1024,
    nullable: true,
  })
  storageKey!: string | null;

  @Column({
    name: 'original_filename',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  originalFilename!: string | null;

  @Index('IDX_media_assets_checksum')
  @Column({ type: 'varchar', length: 128, nullable: true })
  checksum!: string | null;

  @Column({
    type: 'enum',
    enum: MediaAssetType,
    default: MediaAssetType.IMAGE,
  })
  type!: MediaAssetType;

  @Column({
    type: 'enum',
    enum: MediaAssetUsage,
    default: MediaAssetUsage.GENERAL,
  })
  usage!: MediaAssetUsage;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  width?: number;

  @Column({ type: 'int', nullable: true })
  height?: number;

  @Column({ name: 'file_size_bytes', type: 'int', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

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
