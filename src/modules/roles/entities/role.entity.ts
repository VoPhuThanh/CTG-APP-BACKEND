import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  roleName!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
