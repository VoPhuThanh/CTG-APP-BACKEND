import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Club } from './club.entity';

@Entity('club_gallery_media_assets')
@Unique('UQ_club_gallery_media_asset', ['clubId', 'mediaAssetId'])
@Unique('UQ_club_gallery_display_order', ['clubId', 'displayOrder'])
@Check('CHK_club_gallery_display_order_nonnegative', '"display_order" >= 0')
export class ClubGalleryMediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_club_gallery_media_assets_club_id')
  @Column({ name: 'club_id', type: 'uuid' })
  clubId!: string;

  @ManyToOne(() => Club, (club) => club.galleryMedia, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'club_id',
    foreignKeyConstraintName: 'FK_club_gallery_media_assets_club',
  })
  club!: Club;

  @Index('IDX_club_gallery_media_assets_media_asset_id')
  @Column({ name: 'media_asset_id', type: 'uuid' })
  mediaAssetId!: string;

  @ManyToOne(() => MediaAsset, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'media_asset_id',
    foreignKeyConstraintName: 'FK_club_gallery_media_assets_media_asset',
  })
  mediaAsset!: MediaAsset;

  @Index('IDX_club_gallery_media_assets_order')
  @Column({ name: 'display_order', type: 'int' })
  displayOrder!: number;
}
