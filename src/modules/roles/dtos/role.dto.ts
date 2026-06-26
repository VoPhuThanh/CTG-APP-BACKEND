import { Expose } from 'class-transformer';

export class RoleReponseDto {
  @Expose()
  id!: string;

  @Expose()
  roleName!: string;
}
