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
  })
  placement!: BannerPlacement;

  @Column({ name: 'title_en', length: 150, nullable: true })
  titleEn?: string;

  @Column({ name: 'title_vi', length: 150, nullable: true })
  titleVi?: string;

  @Column({ name: 'subtitle_en', type: 'text', nullable: true })
  subtitleEn?: string;

  @Column({ name: 'subtitle_vi', type: 'text', nullable: true })
  subtitleVi?: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @Column({ name: 'mobile_image_url', type: 'text', nullable: true })
  mobileImageUrl?: string;

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
