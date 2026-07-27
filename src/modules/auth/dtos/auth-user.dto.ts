import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '@/cores/dtos/role.dto';

export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ type: RoleDto })
  role!: RoleDto;

  @ApiProperty({ type: String, isArray: true })
  permissions!: string[];
}
