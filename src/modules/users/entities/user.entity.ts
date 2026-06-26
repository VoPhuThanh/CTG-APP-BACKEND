import { BaseEntityCore } from '@/cores/entities/core-entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntityCore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
  })
  @JoinColumn({
    name: 'role_id',
  })
  role!: Role;
}
