import { RoleReponseDto } from '@/modules/roles/dtos/role.dto';
import { Exclude, Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  username!: string;

  @Expose()
  @Type(() => RoleReponseDto)
  role!: RoleReponseDto;

  @Expose()
  createdAt!: Date;

  @Exclude()
  passwordHash!: string;
}
