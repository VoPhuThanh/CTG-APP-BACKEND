import { IsString, MinLength } from 'class-validator';

export class UserUpdateDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  roleId!: string;
}
