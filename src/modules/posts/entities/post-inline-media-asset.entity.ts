import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PostContentLocale } from '../enums/post-content-locale.enum';
import { Post } from './post.entity';

@Entity('post_inline_media_assets')
@Unique('UQ_post_inline_media_asset_locale', [
  'postId',
  'mediaAssetId',
  'locale',
])
export class PostInlineMediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_post_inline_media_assets_post_id')
  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @ManyToOne(() => Post, (post) => post.inlineMediaReferences, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'post_id',
    foreignKeyConstraintName: 'FK_post_inline_media_assets_post',
  })
  post!: Post;

  @Index('IDX_post_inline_media_assets_media_asset_id')
  @Column({ name: 'media_asset_id', type: 'uuid' })
  mediaAssetId!: string;

  @ManyToOne(() => MediaAsset, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'media_asset_id',
    foreignKeyConstraintName: 'FK_post_inline_media_assets_media_asset',
  })
  mediaAsset!: MediaAsset;

  @Column({ type: 'enum', enum: PostContentLocale })
  locale!: PostContentLocale;
}
