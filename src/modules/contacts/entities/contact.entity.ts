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

@Entity('contacts')
@Index('UQ_contacts_singleton_active', { synchronize: false })
export class Contact extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'address_en', type: 'text' })
  addressEn!: string;

  @Column({ name: 'address_vi', type: 'text' })
  addressVi!: string;

  @Column({ length: 50 })
  hotline!: string;

  @Column({ length: 254 })
  email!: string;

  @Column({ name: 'google_map_embed_url', type: 'text' })
  googleMapEmbedUrl!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedBy?: User;
}
