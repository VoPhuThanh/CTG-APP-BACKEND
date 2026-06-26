import { IsString, IsUUID, MinLength } from 'class-validator';

export class UserCreateDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsUUID()
  roleId!: string;
}
