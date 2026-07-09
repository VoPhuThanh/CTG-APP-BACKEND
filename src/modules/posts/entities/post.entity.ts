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
import { PostStatus } from '../enums/post.enum';
import { PostCategory } from './post-category.entity';

@Entity('posts')
export class Post extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'title_en', length: 200 })
  titleEn!: string;

  @Column({ name: 'title_vi', length: 200 })
  titleVi!: string;

  @Index()
  @Column({ unique: true, length: 220 })
  slug!: string;

  @ManyToOne(() => PostCategory, (category) => category.posts, {
    nullable: false,
  })
  @JoinColumn({
    name: 'category_id',
  })
  category!: PostCategory;

  @Column({ name: 'short_description_en', type: 'text', nullable: true })
  shortDescriptionEn?: string;

  @Column({ name: 'short_description_vi', type: 'text', nullable: true })
  shortDescriptionVi?: string;

  @Column({ name: 'content_url_en', type: 'text', nullable: true })
  contentUrlEn?: string;

  @Column({ name: 'content_url_vi', type: 'text', nullable: true })
  contentUrlVi?: string;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

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
