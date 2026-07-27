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
import {
  BannerPlacement,
  BannerLinkTarget,
  BannerStatus,
} from '../enums/banner.enum';

@Entity('banners')
export class Banner extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: BannerPlacement,
    default: BannerPlacement.HOMEPAGE_CAROUSEL,
    nullable: true,
  })
  placement!: BannerPlacement | null;

  @Column({ name: 'legacy_placement', type: 'varchar', nullable: true })
  legacyPlacement!: string | null;

  @Column({ name: 'legacy_status', type: 'varchar', nullable: true })
  legacyStatus!: string | null;

  @Column({ name: 'title_en', length: 150, nullable: true })
  titleEn?: string;

  @Column({ name: 'title_vi', length: 150, nullable: true })
  titleVi?: string;

  @Column({ name: 'subtitle_en', type: 'text', nullable: true })
  subtitleEn?: string;

  @Column({ name: 'subtitle_vi', type: 'text', nullable: true })
  subtitleVi?: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Index('IDX_banners_image_asset_id')
  @Column({ name: 'image_asset_id', type: 'uuid', nullable: true })
  imageAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'image_asset_id',
    foreignKeyConstraintName: 'FK_banners_image_asset',
  })
  imageAsset!: MediaAsset | null;

  @Column({ name: 'mobile_image_url', type: 'text', nullable: true })
  mobileImageUrl?: string;

  @Index('IDX_banners_mobile_image_asset_id')
  @Column({ name: 'mobile_image_asset_id', type: 'uuid', nullable: true })
  mobileImageAssetId!: string | null;

  @ManyToOne(() => MediaAsset, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'mobile_image_asset_id',
    foreignKeyConstraintName: 'FK_banners_mobile_image_asset',
  })
  mobileImageAsset!: MediaAsset | null;

  @Column({ name: 'link_url_en', type: 'text', nullable: true })
  linkUrlEn?: string;

  @Column({ name: 'link_url_vi', type: 'text', nullable: true })
  linkUrlVi?: string;

  @Column({
    name: 'link_target',
    type: 'enum',
    enum: BannerLinkTarget,
    default: BannerLinkTarget.SELF,
  })
  linkTarget!: BannerLinkTarget;

  @Index()
  @Column({
    type: 'enum',
    enum: BannerStatus,
    default: BannerStatus.DRAFT,
  })
  status!: BannerStatus;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt?: Date;

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
