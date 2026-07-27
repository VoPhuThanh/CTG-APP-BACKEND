import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('permissions')
export class Permissions extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  action!: string;

  @Column()
  module!: string;

  @Column({ nullable: true })
  description!: string;

  @ManyToMany(() => Role)
  roles!: Role[];

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
